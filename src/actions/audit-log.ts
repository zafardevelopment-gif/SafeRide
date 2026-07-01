"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_name: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Called from within already-admin-gated mutations — assumes the caller
// has already passed its own assertAdmin() check.
export async function logAdminAction(
  action: string,
  targetTable?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const adminClient = createAdminClient();
  await adminClient.from("ss_audit_log").insert({
    admin_user_id: user.id,
    action,
    target_table: targetTable ?? null,
    target_id: targetId ?? null,
    details: details ?? null,
  });
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_audit_log")
    .select("*, ss_users(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    ...row,
    admin_name: (row.ss_users as unknown as { name: string | null } | null)?.name ?? "Unknown admin",
  }));
}
