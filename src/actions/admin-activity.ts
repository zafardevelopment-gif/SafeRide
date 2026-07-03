"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.role === "admin";
}

export interface ActivityData {
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  totalCommissionPending: number;
  activationsThisMonth: number;
  activationsByDay: { date: string; count: number }[];
  planAdoption: { planName: string; count: number }[];
  topAgents: { name: string; referralCode: string; totalEarned: number }[];
}

const EMPTY: ActivityData = {
  totalCommissionEarned: 0,
  totalCommissionPaid: 0,
  totalCommissionPending: 0,
  activationsThisMonth: 0,
  activationsByDay: [],
  planAdoption: [],
  topAgents: [],
};

export async function getActivityData(): Promise<ActivityData> {
  if (!(await assertAdmin())) return EMPTY;

  const adminClient = createAdminClient();

  const [{ data: agents }, { data: qrCodes }, { data: subscriptions }] = await Promise.all([
    adminClient
      .from("ss_agents")
      .select("total_commission_earned, total_commission_paid, referral_code, ss_users!ss_agents_user_id_fkey(name)")
      .order("total_commission_earned", { ascending: false }),
    adminClient
      .from("ss_qr_codes")
      .select("activated_at")
      .not("activated_at", "is", null),
    adminClient.from("ss_subscriptions").select("status, ss_plans(name)").eq("status", "active"),
  ]);

  const totalCommissionEarned = (agents ?? []).reduce((sum, a) => sum + a.total_commission_earned, 0);
  const totalCommissionPaid = (agents ?? []).reduce((sum, a) => sum + a.total_commission_paid, 0);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activations = (qrCodes ?? [])
    .map((q) => (q.activated_at ? new Date(q.activated_at) : null))
    .filter((d): d is Date => d !== null && d >= thirtyDaysAgo);

  const activationsThisMonth = activations.filter((d) => d >= monthStart).length;

  const dayCounts = new Map<string, number>();
  for (const date of activations) {
    const key = date.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const activationsByDay = [...dayCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const planCounts = new Map<string, number>();
  for (const sub of subscriptions ?? []) {
    const planName = (sub.ss_plans as unknown as { name: string } | null)?.name ?? "Unknown";
    planCounts.set(planName, (planCounts.get(planName) ?? 0) + 1);
  }
  const planAdoption = [...planCounts.entries()].map(([planName, count]) => ({ planName, count }));

  const topAgents = (agents ?? []).slice(0, 5).map((a) => ({
    name: (a.ss_users as unknown as { name: string | null } | null)?.name ?? "Unnamed agent",
    referralCode: a.referral_code,
    totalEarned: a.total_commission_earned,
  }));

  return {
    totalCommissionEarned,
    totalCommissionPaid,
    totalCommissionPending: totalCommissionEarned - totalCommissionPaid,
    activationsThisMonth,
    activationsByDay,
    planAdoption,
    topAgents,
  };
}
