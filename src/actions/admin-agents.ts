"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, Agent } from "@/types";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export interface AgentWithStats extends Agent {
  name: string;
  email: string | null;
  batch_count: number;
  pending_commission_count: number;
}

export async function getAllAgentsWithStats(): Promise<AgentWithStats[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data: agents } = await adminClient
    .from("ss_agents")
    .select("*, ss_users(name, email)")
    .order("created_at", { ascending: false });

  if (!agents || agents.length === 0) return [];

  const agentIds = agents.map((a) => a.id);

  const [{ data: batches }, { data: commissions }] = await Promise.all([
    adminClient.from("ss_qr_batches").select("agent_id").in("agent_id", agentIds),
    adminClient.from("ss_commissions").select("agent_id, status").in("agent_id", agentIds),
  ]);

  return agents.map((a) => {
    const user = a.ss_users as unknown as { name: string | null; email: string | null } | null;
    return {
      ...a,
      name: user?.name ?? "Unnamed agent",
      email: user?.email ?? null,
      batch_count: batches?.filter((b) => b.agent_id === a.id).length ?? 0,
      pending_commission_count:
        commissions?.filter((c) => c.agent_id === a.id && c.status === "pending").length ?? 0,
    };
  });
}

export async function getAgentDetail(agentId: string): Promise<AgentWithStats | null> {
  const guard = await assertAdmin();
  if (guard) return null;

  const adminClient = createAdminClient();
  const { data: agent } = await adminClient
    .from("ss_agents")
    .select("*, ss_users(name, email)")
    .eq("id", agentId)
    .single();

  if (!agent) return null;

  const [{ data: batches }, { data: commissions }] = await Promise.all([
    adminClient.from("ss_qr_batches").select("agent_id").eq("agent_id", agentId),
    adminClient.from("ss_commissions").select("agent_id, status").eq("agent_id", agentId),
  ]);

  const { data: bankDetails } = (await adminClient
    .rpc("ss_get_agent_bank_details_by_id", { p_agent_id: agentId, p_key: ENCRYPTION_KEY })
    .maybeSingle()) as {
    data: {
      bank_account_name: string | null;
      bank_account_number: string | null;
      bank_ifsc: string | null;
      upi_id: string | null;
    } | null;
  };

  const user = agent.ss_users as unknown as { name: string | null; email: string | null } | null;
  return {
    ...agent,
    bank_account_name: bankDetails?.bank_account_name ?? null,
    bank_account_number: bankDetails?.bank_account_number ?? null,
    bank_ifsc: bankDetails?.bank_ifsc ?? null,
    upi_id: bankDetails?.upi_id ?? null,
    name: user?.name ?? "Unnamed agent",
    email: user?.email ?? null,
    batch_count: batches?.length ?? 0,
    pending_commission_count: commissions?.filter((c) => c.status === "pending").length ?? 0,
  };
}
