"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleSchema, emergencyContactSchema, medicalProfileSchema } from "@/validators/vehicle";
import { getCommissionAmount } from "@/actions/settings";
import { sendEmail } from "@/notifications/email";
import { qrActivatedEmail } from "@/notifications/email-templates";
import type { ActionResult } from "@/types";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

interface ActivateQRInput {
  vehicle: {
    vehicle_number: string;
    type: string;
    brand: string;
    model: string;
    color: string;
    year?: number;
  };
  contact: {
    name: string;
    relation: string;
    phone: string;
  };
  medical?: {
    blood_group?: string;
    allergies?: string;
    conditions?: string;
    notes?: string;
    consent_given: boolean;
  };
}

export async function activateQRCode(
  qrId: string,
  input: ActivateQRInput
): Promise<ActionResult<{ vehicleId: string }>> {
  const vehicleParsed = vehicleSchema.safeParse(input.vehicle);
  if (!vehicleParsed.success) {
    return { success: false, error: vehicleParsed.error.issues[0]?.message ?? "Invalid vehicle details." };
  }

  const contactParsed = emergencyContactSchema.safeParse({ ...input.contact, priority_order: 1 });
  if (!contactParsed.success) {
    return { success: false, error: contactParsed.error.issues[0]?.message ?? "Invalid emergency contact." };
  }

  let medicalParsed: ReturnType<typeof medicalProfileSchema.safeParse> | null = null;
  if (input.medical && (input.medical.blood_group || input.medical.allergies || input.medical.conditions || input.medical.notes)) {
    medicalParsed = medicalProfileSchema.safeParse(input.medical);
    if (!medicalParsed.success) {
      return { success: false, error: medicalParsed.error.issues[0]?.message ?? "Invalid medical details." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const adminClient = createAdminClient();

  const { data: qrCode, error: qrFetchError } = await adminClient
    .from("ss_qr_codes")
    .select("id, qr_id, status, agent_id")
    .eq("qr_id", qrId)
    .single();

  if (qrFetchError || !qrCode) return { success: false, error: "QR code not found." };
  if (qrCode.status !== "unactivated") {
    return { success: false, error: "This QR sticker is already activated or unavailable." };
  }

  const { data: vehicle, error: vehicleError } = await supabase
    .from("ss_vehicles")
    .insert({ ...vehicleParsed.data, owner_id: user.id })
    .select()
    .single();

  if (vehicleError) {
    if (vehicleError.code === "23505") {
      return { success: false, error: "You've already registered a vehicle with this number." };
    }
    return { success: false, error: vehicleError.message };
  }

  const { error: contactError } = await supabase
    .from("ss_emergency_contacts")
    .insert({ ...contactParsed.data, vehicle_id: vehicle.id });

  if (contactError) {
    return { success: false, error: `Vehicle saved but contact failed: ${contactError.message}` };
  }

  if (medicalParsed?.success) {
    const { error: medicalError } = await supabase.rpc("ss_upsert_medical_profile", {
      p_vehicle_id: vehicle.id,
      p_blood_group: medicalParsed.data.blood_group ?? null,
      p_allergies: medicalParsed.data.allergies ?? null,
      p_conditions: medicalParsed.data.conditions ?? null,
      p_notes: medicalParsed.data.notes ?? null,
      p_consent_given: medicalParsed.data.consent_given,
      p_key: ENCRYPTION_KEY,
    });
    if (medicalError) {
      return { success: false, error: `Vehicle saved but medical profile failed: ${medicalError.message}` };
    }
  }

  const { error: activateError } = await adminClient
    .from("ss_qr_codes")
    .update({
      vehicle_id: vehicle.id,
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .eq("id", qrCode.id);

  if (activateError) {
    return { success: false, error: `Vehicle saved but activation failed: ${activateError.message}` };
  }

  // A QR tagged with an agent at batch generation always wins. Only fall back
  // to the activating user's stored referral agent when the QR itself is untagged.
  let commissionAgentId = qrCode.agent_id;
  if (!commissionAgentId) {
    const { data: profile } = await adminClient
      .from("ss_users")
      .select("referred_by_agent_id")
      .eq("id", user.id)
      .single();
    commissionAgentId = profile?.referred_by_agent_id ?? null;
  }

  if (commissionAgentId) {
    const commissionAmount = await getCommissionAmount();
    const { error: commissionError } = await adminClient.from("ss_commissions").insert({
      agent_id: commissionAgentId,
      qr_id: qrCode.qr_id,
      amount: commissionAmount,
      status: "pending",
    });
    if (commissionError && commissionError.code !== "23505") {
      console.error("[activateQRCode] commission insert failed:", commissionError);
    } else if (!commissionError) {
      const { data: agent } = await adminClient
        .from("ss_agents")
        .select("total_commission_earned")
        .eq("id", commissionAgentId)
        .single();
      if (agent) {
        await adminClient
          .from("ss_agents")
          .update({ total_commission_earned: agent.total_commission_earned + commissionAmount })
          .eq("id", commissionAgentId);
      }
    }
  }

  const { data: profile } = await adminClient
    .from("ss_users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  if (profile?.email) {
    const { subject, html } = qrActivatedEmail(profile.name, vehicleParsed.data.vehicle_number, qrCode.qr_id);
    sendEmail({ to: profile.email, subject, html }).catch((err) =>
      console.error("[activateQRCode] qrActivatedEmail failed:", err)
    );
  }

  return { success: true, data: { vehicleId: vehicle.id } };
}
