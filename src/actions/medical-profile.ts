"use server";

import { createClient } from "@/lib/supabase/server";
import { medicalProfileSchema, type MedicalProfileInput } from "@/validators/vehicle";
import type { ActionResult, MedicalProfile } from "@/types";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export async function getMedicalProfile(vehicleId: string): Promise<MedicalProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .rpc("ss_get_medical_profile", { p_vehicle_id: vehicleId, p_key: ENCRYPTION_KEY })
    .maybeSingle();
  return (data as MedicalProfile) ?? null;
}

export async function upsertMedicalProfile(
  vehicleId: string,
  input: MedicalProfileInput
): Promise<ActionResult<MedicalProfile>> {
  const parsed = medicalProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid medical details." };
  }

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

  const { data, error } = await supabase
    .rpc("ss_upsert_medical_profile", {
      p_vehicle_id: vehicleId,
      p_blood_group: parsed.data.blood_group ?? null,
      p_allergies: parsed.data.allergies ?? null,
      p_conditions: parsed.data.conditions ?? null,
      p_notes: parsed.data.notes ?? null,
      p_consent_given: parsed.data.consent_given,
      p_key: ENCRYPTION_KEY,
    })
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as MedicalProfile };
}

export async function deleteMedicalProfile(vehicleId: string): Promise<ActionResult> {
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

  const { error } = await supabase.from("ss_medical_profiles").delete().eq("vehicle_id", vehicleId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
