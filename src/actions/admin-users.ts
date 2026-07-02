"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/actions/audit-log";
import type { ActionResult, User, UserRole } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export async function getAllUsers(): Promise<User[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_users")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getUserDetail(userId: string): Promise<(User & { agent_id: string | null }) | null> {
  const guard = await assertAdmin();
  if (guard) return null;

  const adminClient = createAdminClient();
  const { data: user } = await adminClient.from("ss_users").select("*").eq("id", userId).single();
  if (!user) return null;

  const { data: agent } = await adminClient
    .from("ss_agents")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return { ...user, agent_id: agent?.id ?? null };
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("ss_users").update({ role }).eq("id", userId);

  if (error) return { success: false, error: error.message };
  await logAdminAction("update_user_role", "ss_users", userId, { role });
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("ss_users").update({ is_active: isActive }).eq("id", userId);

  if (error) return { success: false, error: error.message };
  await logAdminAction(isActive ? "reactivate_user" : "deactivate_user", "ss_users", userId);
  return { success: true };
}

// Soft delete: blocks login and blanks PII, but keeps the row (and every
// payment/QR-batch/vehicle row that references it) intact. A hard delete
// from auth.users can fail outright — ss_qr_batches.created_by and
// ss_payments.user_id intentionally have no ON DELETE CASCADE, since
// payment and audit history must survive the user who generated it.
export async function deleteUser(userId: string): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();

  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: "876000h", // ~100 years — effectively permanent
  });
  if (authError) return { success: false, error: authError.message };

  const { error } = await adminClient
    .from("ss_users")
    .update({
      name: "Deleted user",
      email: null,
      phone: null,
      avatar_url: null,
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  await logAdminAction("delete_user", "ss_users", userId);
  return { success: true };
}
