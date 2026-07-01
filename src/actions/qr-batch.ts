"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQRId } from "@/lib/utils";
import { logAdminAction } from "@/actions/audit-log";
import type { ActionResult, QRBatch, QRCode } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export async function getQRBatches(): Promise<(QRBatch & { agent_name: string | null })[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data: batches } = await adminClient
    .from("ss_qr_batches")
    .select("*")
    .order("created_at", { ascending: false });

  if (!batches || batches.length === 0) return [];

  const agentIds = [...new Set(batches.map((b) => b.agent_id).filter(Boolean))];
  const { data: agents } = agentIds.length
    ? await adminClient
        .from("ss_agents")
        .select("id, user_id, ss_users(name)")
        .in("id", agentIds as string[])
    : { data: [] };

  return batches.map((b) => ({
    ...b,
    agent_name:
      (agents?.find((a) => a.id === b.agent_id)?.ss_users as unknown as { name: string | null } | null)
        ?.name ?? null,
  }));
}

export async function getQRBatch(id: string): Promise<{ batch: QRBatch; codes: QRCode[] } | null> {
  const guard = await assertAdmin();
  if (guard) return null;

  const adminClient = createAdminClient();
  const { data: batch } = await adminClient.from("ss_qr_batches").select("*").eq("id", id).single();
  if (!batch) return null;

  const { data: codes } = await adminClient
    .from("ss_qr_codes")
    .select("*")
    .eq("batch_id", id)
    .order("created_at", { ascending: true });

  return { batch, codes: codes ?? [] };
}

export async function getAgentsForSelect(): Promise<{ id: string; name: string; referral_code: string }[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_agents")
    .select("id, referral_code, ss_users(name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((a) => ({
    id: a.id,
    referral_code: a.referral_code,
    name: (a.ss_users as unknown as { name: string | null } | null)?.name ?? "Unnamed agent",
  }));
}

export async function createQRBatch(input: {
  quantity: number;
  agentId?: string;
  notes?: string;
}): Promise<ActionResult<{ batchId: string }>> {
  const guard = await assertAdmin();
  if (guard) return { success: false, error: guard.error };

  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 5000) {
    return { success: false, error: "Quantity must be between 1 and 5000." };
  }

  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  const { data: batch, error: batchError } = await adminClient
    .from("ss_qr_batches")
    .insert({
      agent_id: input.agentId || null,
      quantity: input.quantity,
      notes: input.notes || null,
      created_by: user!.id,
    })
    .select()
    .single();

  if (batchError) return { success: false, error: batchError.message };

  const qrIds = new Set<string>();
  while (qrIds.size < input.quantity) {
    qrIds.add(generateQRId());
  }

  const rows = [...qrIds].map((qr_id) => ({
    qr_id,
    batch_id: batch.id,
    agent_id: input.agentId || null,
  }));

  const { error: codesError } = await adminClient.from("ss_qr_codes").insert(rows);

  if (codesError) {
    return { success: false, error: `Batch created but codes failed: ${codesError.message}` };
  }

  await logAdminAction("create_qr_batch", "ss_qr_batches", batch.id, {
    quantity: input.quantity,
    agentId: input.agentId ?? null,
  });
  return { success: true, data: { batchId: batch.id } };
}

// Only allowed while every code in the batch is still unactivated — deleting
// an activated code would break a real customer's already-linked sticker.
export async function deleteQRBatch(batchId: string): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();

  const { data: codes } = await adminClient
    .from("ss_qr_codes")
    .select("id, status")
    .eq("batch_id", batchId);

  const activatedCount = (codes ?? []).filter((c) => c.status !== "unactivated").length;
  if (activatedCount > 0) {
    return {
      success: false,
      error: `Can't delete — ${activatedCount} code${activatedCount > 1 ? "s" : ""} in this batch already activated.`,
    };
  }

  const { error: codesError } = await adminClient.from("ss_qr_codes").delete().eq("batch_id", batchId);
  if (codesError) return { success: false, error: codesError.message };

  const { error: batchError } = await adminClient.from("ss_qr_batches").delete().eq("id", batchId);
  if (batchError) return { success: false, error: batchError.message };

  await logAdminAction("delete_qr_batch", "ss_qr_batches", batchId);
  return { success: true };
}

// Only allowed on unactivated codes — an activated code already has a
// commission record tied to its original agent_id, which this deliberately
// never touches (see assertAdmin guard + status check below).
export async function assignQRCodeAgent(codeId: string, agentId: string | null): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();

  const { data: code } = await adminClient
    .from("ss_qr_codes")
    .select("id, status")
    .eq("id", codeId)
    .single();

  if (!code) return { success: false, error: "QR code not found." };
  if (code.status !== "unactivated") {
    return { success: false, error: "Only unactivated QR codes can be reassigned." };
  }

  const { error } = await adminClient
    .from("ss_qr_codes")
    .update({ agent_id: agentId })
    .eq("id", codeId);

  if (error) return { success: false, error: error.message };

  await logAdminAction("assign_qr_code_agent", "ss_qr_codes", codeId, { agentId });
  return { success: true };
}
