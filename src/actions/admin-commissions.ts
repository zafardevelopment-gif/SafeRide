"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/actions/audit-log";
import type { ActionResult, Commission, CommissionStatus } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export interface CommissionWithAgent extends Commission {
  agent_name: string;
  agent_referral_code: string;
}

export async function getAllCommissions(): Promise<CommissionWithAgent[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_commissions")
    .select("*, ss_agents(referral_code, ss_users!ss_agents_user_id_fkey(name))")
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => {
    const agent = c.ss_agents as unknown as {
      referral_code: string;
      ss_users: { name: string | null } | null;
    } | null;
    return {
      ...c,
      agent_name: agent?.ss_users?.name ?? "Unnamed agent",
      agent_referral_code: agent?.referral_code ?? "",
    };
  });
}

export async function updateCommissionStatus(
  commissionId: string,
  status: CommissionStatus
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();

  const { data: commission } = await adminClient
    .from("ss_commissions")
    .select("id, agent_id, amount, status")
    .eq("id", commissionId)
    .single();

  if (!commission) return { success: false, error: "Commission not found." };

  const wasAlreadyPaid = commission.status === "paid";
  const isNowPaid = status === "paid";

  const { error } = await adminClient
    .from("ss_commissions")
    .update({
      status,
      paid_at: isNowPaid ? new Date().toISOString() : null,
    })
    .eq("id", commissionId);

  if (error) return { success: false, error: error.message };

  // Keep the denormalised agent totals in sync — there's no trigger for this.
  if (isNowPaid && !wasAlreadyPaid) {
    const { data: agent } = await adminClient
      .from("ss_agents")
      .select("total_commission_paid")
      .eq("id", commission.agent_id)
      .single();

    if (agent) {
      await adminClient
        .from("ss_agents")
        .update({
          total_commission_paid: agent.total_commission_paid + commission.amount,
          withdrawal_requested_at: null,
        })
        .eq("id", commission.agent_id);
    }
  } else if (!isNowPaid && wasAlreadyPaid) {
    const { data: agent } = await adminClient
      .from("ss_agents")
      .select("total_commission_paid")
      .eq("id", commission.agent_id)
      .single();

    if (agent) {
      await adminClient
        .from("ss_agents")
        .update({
          total_commission_paid: Math.max(0, agent.total_commission_paid - commission.amount),
        })
        .eq("id", commission.agent_id);
    }
  }

  await logAdminAction("update_commission_status", "ss_commissions", commissionId, { status });
  return { success: true };
}
