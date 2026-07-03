"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleSchema, type VehicleInput } from "@/validators/vehicle";
import type { ActionResult, Vehicle, QRCode } from "@/types";

export async function getVehicles(): Promise<(Vehicle & { qr_code: QRCode | null })[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: vehicles } = await supabase
    .from("ss_vehicles")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!vehicles || vehicles.length === 0) return [];

  const { data: qrCodes } = await supabase
    .from("ss_qr_codes")
    .select("*")
    .in(
      "vehicle_id",
      vehicles.map((v) => v.id)
    );

  return vehicles.map((v) => ({
    ...v,
    qr_code: qrCodes?.find((q) => q.vehicle_id === v.id) ?? null,
  }));
}

export async function getVehicle(id: string): Promise<(Vehicle & { qr_code: QRCode | null }) | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehicle } = await supabase
    .from("ss_vehicles")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!vehicle) return null;

  const { data: qrCode } = await supabase
    .from("ss_qr_codes")
    .select("*")
    .eq("vehicle_id", id)
    .maybeSingle();

  return { ...vehicle, qr_code: qrCode ?? null };
}

export async function createVehicle(input: VehicleInput): Promise<ActionResult<Vehicle>> {
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid vehicle details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("ss_vehicles")
    .insert({ ...parsed.data, owner_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You've already registered a vehicle with this number." };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<ActionResult<Vehicle>> {
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid vehicle details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("ss_vehicles")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You've already registered a vehicle with this number." };
    }
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("ss_vehicles")
    .update({ is_active: false })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Owner has no UPDATE policy on ss_qr_codes, so this verifies ownership
// via the vehicle first, then applies the status change with the admin client.
export async function reportLostOrDamaged(vehicleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: vehicle } = await supabase
    .from("ss_vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("owner_id", user.id)
    .single();

  if (!vehicle) return { success: false, error: "Vehicle not found." };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("ss_qr_codes")
    .update({ status: "lost", suspended_at: new Date().toISOString() })
    .eq("vehicle_id", vehicleId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
