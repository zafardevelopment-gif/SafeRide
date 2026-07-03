"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/actions/audit-log";
import { vehicleSchema, emergencyContactSchema } from "@/validators/vehicle";
import type { ActionResult } from "@/types";

const PLACEHOLDER_EMAIL = "unclaimed-stock@saferide.internal";
const PLACEHOLDER_NAME = "Unclaimed Stock";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

// Every ss_vehicles.owner_id must reference a real auth.users row, so
// placeholder vehicles (admin-prepared stock, phone orders) are parked
// under one fixed system account rather than a real customer's — the
// real buyer later "claims" the sticker and takes over ownership.
async function getOrCreatePlaceholderOwnerId(): Promise<string> {
  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from("ss_users")
    .select("id")
    .eq("email", PLACEHOLDER_EMAIL)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email: PLACEHOLDER_EMAIL,
    email_confirm: true,
    user_metadata: { name: PLACEHOLDER_NAME },
  });
  if (error || !created.user) {
    throw new Error(`Failed to create placeholder stock account: ${error?.message}`);
  }

  await adminClient
    .from("ss_users")
    .update({ name: PLACEHOLDER_NAME, role: "customer", profile_completed: true })
    .eq("id", created.user.id);

  return created.user.id;
}

interface AdminActivateInput {
  vehicle: {
    vehicle_number: string;
    type: string;
    brand: string;
    model: string;
    color: string;
    year?: number;
  };
  contact?: {
    name: string;
    relation: string;
    phone: string;
    email?: string;
  };
}

const PLACEHOLDER_CONTACT = { name: "Unclaimed", relation: "Pending", phone: "9999999999" };

/**
 * Admin activates an unactivated sticker on behalf of someone who isn't
 * going through the self-serve scan flow — a phone order, or bulk Amazon
 * stock prep. The vehicle is owned by a fixed placeholder account and
 * flagged is_placeholder; whoever scans it later can claim it with their
 * real details (see claimPlaceholderVehicle in src/actions/claim-vehicle.ts).
 * No commission is recorded here — it fires only when the real customer
 * claims the sticker, same as a normal activation.
 */
export async function adminActivateQRCode(
  qrId: string,
  input: AdminActivateInput
): Promise<ActionResult<{ vehicleId: string }>> {
  const guard = await assertAdmin();
  if (guard) return { success: false, error: guard.error };

  const vehicleParsed = vehicleSchema.safeParse(input.vehicle);
  if (!vehicleParsed.success) {
    return { success: false, error: vehicleParsed.error.issues[0]?.message ?? "Invalid vehicle details." };
  }

  const contactInput = input.contact ?? PLACEHOLDER_CONTACT;
  const contactParsed = emergencyContactSchema.safeParse({ ...contactInput, priority_order: 1 });
  if (!contactParsed.success) {
    return { success: false, error: contactParsed.error.issues[0]?.message ?? "Invalid emergency contact." };
  }

  const adminClient = createAdminClient();

  const { data: qrCode, error: qrFetchError } = await adminClient
    .from("ss_qr_codes")
    .select("id, qr_id, status")
    .eq("qr_id", qrId)
    .maybeSingle();

  if (qrFetchError || !qrCode) return { success: false, error: "QR code not found." };
  if (qrCode.status !== "unactivated") {
    return { success: false, error: "This QR sticker is already activated or unavailable." };
  }

  let ownerId: string;
  try {
    ownerId = await getOrCreatePlaceholderOwnerId();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to prepare placeholder account." };
  }

  const { data: vehicle, error: vehicleError } = await adminClient
    .from("ss_vehicles")
    .insert({ ...vehicleParsed.data, owner_id: ownerId, is_placeholder: true })
    .select()
    .single();

  if (vehicleError) {
    if (vehicleError.code === "23505") {
      return { success: false, error: "A placeholder vehicle with this number already exists." };
    }
    return { success: false, error: vehicleError.message };
  }

  const { error: contactError } = await adminClient
    .from("ss_emergency_contacts")
    .insert({ ...contactParsed.data, email: contactParsed.data.email || null, vehicle_id: vehicle.id });

  if (contactError) {
    return { success: false, error: `Vehicle saved but contact failed: ${contactError.message}` };
  }

  const { error: activateError } = await adminClient
    .from("ss_qr_codes")
    .update({ vehicle_id: vehicle.id, status: "active", activated_at: new Date().toISOString() })
    .eq("id", qrCode.id);

  if (activateError) {
    return { success: false, error: `Vehicle saved but activation failed: ${activateError.message}` };
  }

  await logAdminAction("admin_activate_qr_code", "ss_qr_codes", qrCode.id, {
    vehicleId: vehicle.id,
    placeholder: !input.contact,
  });

  return { success: true, data: { vehicleId: vehicle.id } };
}
