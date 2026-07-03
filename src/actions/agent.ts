"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivationFeeAmount } from "@/actions/settings";
import type { ActionResult, Commission, QRBatch, QRCode } from "@/types";

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

/**
 * Every QR code currently tagged to this agent — covers both whole batches
 * tagged at generation time AND codes individually reassigned later (via
 * admin's per-code reassignment or the Scan & Assign flow), since
 * getMyQRBatches only sees the batch-level tag and misses the latter.
 */
export async function getMyQRCodes(): Promise<(QRCode & { has_been_scanned: boolean })[]> {
  const agentId = await getMyAgentId();
  if (!agentId) return [];

  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("ss_qr_codes")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (!codes || codes.length === 0) return [];

  // RLS on ss_scans only lets a vehicle's owner (or admin) read its scans —
  // an agent's own session can't see them, so this needs the admin client.
  const adminClient = createAdminClient();
  const { data: scans } = await adminClient
    .from("ss_scans")
    .select("qr_id")
    .in(
      "qr_id",
      codes.map((c) => c.qr_id)
    );
  const scannedQrIds = new Set((scans ?? []).map((s) => s.qr_id));

  return codes.map((c) => ({ ...c, has_been_scanned: scannedQrIds.has(c.qr_id) }));
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

export interface AgentBillingSummary {
  cashSales: { count: number; commissionEarned: number; owedToSafeRide: number };
  onlineSales: { count: number; commissionEarned: number; owedBySafeRide: number };
  netSettlement: number; // positive = SafeRide owes agent, negative = agent owes SafeRide
  commissions: (Commission & { channel: "cash" | "online" })[];
}

const EMPTY_BILLING_SUMMARY: AgentBillingSummary = {
  cashSales: { count: 0, commissionEarned: 0, owedToSafeRide: 0 },
  onlineSales: { count: 0, commissionEarned: 0, owedBySafeRide: 0 },
  netSettlement: 0,
  commissions: [],
};

/**
 * Splits an agent's commissions into cash-collected vs online (Razorpay)
 * sales by checking whether a paid ss_payments row exists for each
 * commission's qr_id, then computes what's owed each way.
 * Cash sale: agent collected the activation fee directly, keeps their
 * commission, owes SafeRide the rest. Online sale: customer paid SafeRide
 * directly, so SafeRide owes the agent their full commission.
 *
 * Uses the caller's own createClient() session — RLS restricts a logged-in
 * agent to their own ss_commissions rows regardless of the agentId passed,
 * so admin callers must instead use getAgentBillingSummaryAdmin below.
 */
async function computeBillingSummary(agentId: string | null): Promise<AgentBillingSummary> {
  if (!agentId) return EMPTY_BILLING_SUMMARY;

  const supabase = await createClient();
  const { data: commissions } = await supabase
    .from("ss_commissions")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (!commissions || commissions.length === 0) {
    return {
      cashSales: { count: 0, commissionEarned: 0, owedToSafeRide: 0 },
      onlineSales: { count: 0, commissionEarned: 0, owedBySafeRide: 0 },
      netSettlement: 0,
      commissions: [],
    };
  }

  // Admin client — a payment's user_id is the customer, not this agent, so
  // the RLS-scoped session client would return zero rows here otherwise.
  const adminClient = createAdminClient();
  const { data: paidPayments } = await adminClient
    .from("ss_payments")
    .select("qr_id")
    .eq("status", "paid")
    .in(
      "qr_id",
      commissions.map((c) => c.qr_id)
    );
  const onlinePaidQrIds = new Set((paidPayments ?? []).map((p) => p.qr_id));

  let cashCount = 0;
  let cashCommission = 0;
  let onlineCount = 0;
  let onlineCommission = 0;

  const withChannel = commissions.map((c) => {
    const channel: "cash" | "online" = onlinePaidQrIds.has(c.qr_id) ? "online" : "cash";
    if (channel === "cash") {
      cashCount += 1;
      cashCommission += c.amount;
    } else {
      onlineCount += 1;
      onlineCommission += c.amount;
    }
    return { ...c, channel };
  });

  const activationFeePaise = await getActivationFeeAmount(agentId);
  const owedToSafeRide = cashCount * activationFeePaise - cashCommission;

  return {
    cashSales: { count: cashCount, commissionEarned: cashCommission, owedToSafeRide },
    onlineSales: { count: onlineCount, commissionEarned: onlineCommission, owedBySafeRide: onlineCommission },
    netSettlement: onlineCommission - owedToSafeRide,
    commissions: withChannel,
  };
}

/** Agent-facing: cash vs online billing breakdown for the logged-in agent. */
export async function getMyBillingSummary(): Promise<AgentBillingSummary> {
  const agentId = await getMyAgentId();
  return computeBillingSummary(agentId);
}

/** Admin-facing: same breakdown for an arbitrary agent (admin-gated by the caller's RLS session). */
export async function getAgentBillingSummaryAdmin(agentId: string): Promise<AgentBillingSummary> {
  return computeBillingSummary(agentId);
}

/** Agent flags that they'd like their pending commissions paid out — admin still pays manually. */
export async function requestWithdrawal(): Promise<ActionResult> {
  const agentId = await getMyAgentId();
  if (!agentId) return { success: false, error: "Not an agent." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ss_agents")
    .update({ withdrawal_requested_at: new Date().toISOString() })
    .eq("id", agentId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyWithdrawalRequestedAt(): Promise<string | null> {
  const agentId = await getMyAgentId();
  if (!agentId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_agents")
    .select("withdrawal_requested_at")
    .eq("id", agentId)
    .single();

  return data?.withdrawal_requested_at ?? null;
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
