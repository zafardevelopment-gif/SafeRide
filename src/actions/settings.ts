"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/actions/audit-log";
import type { ActionResult } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

const COMMISSION_KEY = "commission_amount_paise";
const DEFAULT_COMMISSION_PAISE = 5000;

// Public read — used by the (unauthenticated) activation flow, not admin-gated.
// If agentId is given and that agent has a custom commission_amount_paise set,
// it wins over the global default.
export async function getCommissionAmount(agentId?: string | null): Promise<number> {
  const adminClient = createAdminClient();

  if (agentId) {
    const { data: agent } = await adminClient
      .from("ss_agents")
      .select("commission_amount_paise")
      .eq("id", agentId)
      .maybeSingle();
    if (agent?.commission_amount_paise != null) return agent.commission_amount_paise;
  }

  const { data } = await adminClient
    .from("ss_settings")
    .select("value")
    .eq("key", COMMISSION_KEY)
    .maybeSingle();

  const parsed = data ? Number(data.value) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_COMMISSION_PAISE;
}

export async function setCommissionAmount(paise: number): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  if (!Number.isInteger(paise) || paise < 0) {
    return { success: false, error: "Enter a valid amount." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("ss_settings")
    .upsert({ key: COMMISSION_KEY, value: String(paise) }, { onConflict: "key" });

  if (error) return { success: false, error: error.message };
  await logAdminAction("update_commission_amount", "ss_settings", undefined, { paise });
  return { success: true };
}
