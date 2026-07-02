"use server";

import { createClient } from "@/lib/supabase/server";
import { emergencyContactSchema } from "@/validators/vehicle";
import type { ActionResult, EmergencyContact } from "@/types";

async function assertOwnsVehicle(vehicleId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("owner_id", userId)
    .single();
  return !!data;
}

export async function getEmergencyContacts(vehicleId: string): Promise<EmergencyContact[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_emergency_contacts")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("priority_order", { ascending: true });

  return data ?? [];
}

export async function createEmergencyContact(
  vehicleId: string,
  input: { name: string; relation: string; phone: string; email?: string }
): Promise<ActionResult<EmergencyContact>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  if (!(await assertOwnsVehicle(vehicleId, user.id))) {
    return { success: false, error: "Vehicle not found." };
  }

  const { count } = await supabase
    .from("ss_emergency_contacts")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId);

  const parsed = emergencyContactSchema.safeParse({
    ...input,
    priority_order: (count ?? 0) + 1,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid contact details." };
  }

  const { data, error } = await supabase
    .from("ss_emergency_contacts")
    .insert({ ...parsed.data, email: parsed.data.email || null, vehicle_id: vehicleId })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateEmergencyContact(
  id: string,
  input: { name: string; relation: string; phone: string; email?: string }
): Promise<ActionResult<EmergencyContact>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("ss_emergency_contacts")
    .select("vehicle_id, priority_order")
    .eq("id", id)
    .single();

  if (!existing || !(await assertOwnsVehicle(existing.vehicle_id, user.id))) {
    return { success: false, error: "Contact not found." };
  }

  const parsed = emergencyContactSchema.safeParse({
    ...input,
    priority_order: existing.priority_order,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid contact details." };
  }

  const { data, error } = await supabase
    .from("ss_emergency_contacts")
    .update({ ...parsed.data, email: parsed.data.email || null })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function deleteEmergencyContact(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("ss_emergency_contacts")
    .select("vehicle_id")
    .eq("id", id)
    .single();

  if (!existing || !(await assertOwnsVehicle(existing.vehicle_id, user.id))) {
    return { success: false, error: "Contact not found." };
  }

  const { count } = await supabase
    .from("ss_emergency_contacts")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", existing.vehicle_id);

  if ((count ?? 0) <= 1) {
    return { success: false, error: "At least one emergency contact is required." };
  }

  const { error } = await supabase.from("ss_emergency_contacts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
