"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleSchema, emergencyContactSchema } from "@/validators/vehicle";
import { getCommissionAmount } from "@/actions/settings";
import type { ActionResult } from "@/types";

interface ClaimVehicleInput {
  ownerPhone: string;
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
    email?: string;
  };
}

/** Does this QR's linked vehicle need to be claimed (still owned by the placeholder account)? */
export async function getPlaceholderStatus(qrId: string): Promise<{ needsClaim: boolean } | null> {
  const adminClient = createAdminClient();
  const { data: qrCode } = await adminClient
    .from("ss_qr_codes")
    .select("status, vehicle_id")
    .eq("qr_id", qrId)
    .maybeSingle();

  if (!qrCode || qrCode.status !== "active" || !qrCode.vehicle_id) return null;

  const { data: vehicle } = await adminClient
    .from("ss_vehicles")
    .select("is_placeholder")
    .eq("id", qrCode.vehicle_id)
    .single();

  return { needsClaim: vehicle?.is_placeholder ?? false };
}

/**
 * The logged-in customer takes ownership of a sticker that admin activated
 * under the placeholder account (Amazon stock / phone order) — overwrites
 * the placeholder vehicle + contact with real details, reassigns owner_id,
 * and fires commission for the first time (placeholder activation never
 * records one — see src/actions/admin-activate.ts).
 */
export async function claimPlaceholderVehicle(
  qrId: string,
  input: ClaimVehicleInput
): Promise<ActionResult<{ vehicleId: string }>> {
  if (!/^[6-9]\d{9}$/.test(input.ownerPhone)) {
    return { success: false, error: "Enter a valid 10-digit Indian mobile number." };
  }

  const vehicleParsed = vehicleSchema.safeParse(input.vehicle);
  if (!vehicleParsed.success) {
    return { success: false, error: vehicleParsed.error.issues[0]?.message ?? "Invalid vehicle details." };
  }

  const contactParsed = emergencyContactSchema.safeParse({ ...input.contact, priority_order: 1 });
  if (!contactParsed.success) {
    return { success: false, error: contactParsed.error.issues[0]?.message ?? "Invalid emergency contact." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const adminClient = createAdminClient();

  const { data: qrCode } = await adminClient
    .from("ss_qr_codes")
    .select("id, qr_id, status, vehicle_id, agent_id")
    .eq("qr_id", qrId)
    .maybeSingle();

  if (!qrCode || qrCode.status !== "active" || !qrCode.vehicle_id) {
    return { success: false, error: "This sticker isn't ready to be claimed." };
  }

  const { data: existingVehicle } = await adminClient
    .from("ss_vehicles")
    .select("id, is_placeholder")
    .eq("id", qrCode.vehicle_id)
    .single();

  if (!existingVehicle?.is_placeholder) {
    return { success: false, error: "This sticker has already been claimed." };
  }

  const { error: ownerPhoneError } = await adminClient
    .from("ss_users")
    .update({ phone: input.ownerPhone })
    .eq("id", user.id);
  if (ownerPhoneError && ownerPhoneError.code !== "23505") {
    return { success: false, error: `Failed to save your phone number: ${ownerPhoneError.message}` };
  }

  const { data: vehicle, error: vehicleError } = await adminClient
    .from("ss_vehicles")
    .update({ ...vehicleParsed.data, owner_id: user.id, is_placeholder: false })
    .eq("id", existingVehicle.id)
    .select()
    .single();

  if (vehicleError) {
    if (vehicleError.code === "23505") {
      return { success: false, error: "You've already registered a vehicle with this number." };
    }
    return { success: false, error: vehicleError.message };
  }

  await adminClient.from("ss_emergency_contacts").delete().eq("vehicle_id", vehicle.id);
  const { error: contactError } = await adminClient
    .from("ss_emergency_contacts")
    .insert({ ...contactParsed.data, email: contactParsed.data.email || null, vehicle_id: vehicle.id });

  if (contactError) {
    return { success: false, error: `Vehicle saved but contact failed: ${contactError.message}` };
  }

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
    const commissionAmount = await getCommissionAmount(commissionAgentId);
    const { error: commissionError } = await adminClient.from("ss_commissions").insert({
      agent_id: commissionAgentId,
      qr_id: qrCode.qr_id,
      amount: commissionAmount,
      status: "pending",
    });
    if (commissionError && commissionError.code !== "23505") {
      console.error("[claimPlaceholderVehicle] commission insert failed:", commissionError);
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

  return { success: true, data: { vehicleId: vehicle.id } };
}
