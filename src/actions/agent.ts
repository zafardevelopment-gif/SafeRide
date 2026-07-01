"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Commission, QRBatch } from "@/types";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

async function getMyAgentId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: agent } = await supabase
    .from("ss_agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return agent?.id ?? null;
}

export async function getMyQRBatches(): Promise<(QRBatch & { activated_count: number })[]> {
  const agentId = await getMyAgentId();
  if (!agentId) return [];

  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("ss_qr_batches")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (!batches || batches.length === 0) return [];

  const { data: codes } = await supabase
    .from("ss_qr_codes")
    .select("batch_id, status")
    .in(
      "batch_id",
      batches.map((b) => b.id)
    );

  return batches.map((b) => ({
    ...b,
    activated_count: codes?.filter((c) => c.batch_id === b.id && c.status !== "unactivated").length ?? 0,
  }));
}

export async function getMyCommissions(): Promise<Commission[]> {
  const agentId = await getMyAgentId();
  if (!agentId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_commissions")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getMyPayoutHistory(): Promise<Commission[]> {
  const agentId = await getMyAgentId();
  if (!agentId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_commissions")
    .select("*")
    .eq("agent_id", agentId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  return data ?? [];
}

export async function updateBankDetails(input: {
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  upi_id: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase.rpc("ss_update_agent_bank_details", {
    p_user_id: user.id,
    p_bank_account_name: input.bank_account_name || null,
    p_bank_account_number: input.bank_account_number || null,
    p_bank_ifsc: input.bank_ifsc || null,
    p_upi_id: input.upi_id || null,
    p_key: ENCRYPTION_KEY,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyBankDetails(): Promise<{
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  upi_id: string | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = (await supabase
    .rpc("ss_get_agent_bank_details", { p_user_id: user.id, p_key: ENCRYPTION_KEY })
    .maybeSingle()) as {
    data: {
      bank_account_name: string | null;
      bank_account_number: string | null;
      bank_ifsc: string | null;
      upi_id: string | null;
    } | null;
  };

  return data ?? null;
}
