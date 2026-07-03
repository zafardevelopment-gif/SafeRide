"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQRId } from "@/lib/utils";
import { logAdminAction } from "@/actions/audit-log";
import type { ActionResult, QRBatch, QRCode, QRStatus } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export async function getQRBatches(): Promise<
  (QRBatch & { agent_name: string | null; activated_count: number })[]
> {
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

  // Codes that are no longer blank — used to decide if a batch can be deleted.
  const { data: activatedCodes } = await adminClient
    .from("ss_qr_codes")
    .select("batch_id")
    .in(
      "batch_id",
      batches.map((b) => b.id)
    )
    .neq("status", "unactivated");

  const activatedByBatch = new Map<string, number>();
  for (const c of activatedCodes ?? []) {
    activatedByBatch.set(c.batch_id, (activatedByBatch.get(c.batch_id) ?? 0) + 1);
  }

  return batches.map((b) => ({
    ...b,
    agent_name:
      (agents?.find((a) => a.id === b.agent_id)?.ss_users as unknown as { name: string | null } | null)
        ?.name ?? null,
    activated_count: activatedByBatch.get(b.id) ?? 0,
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

export interface QRCodeSearchResult {
  code: QRCode;
  agentName: string | null;
  owner: { name: string | null; email: string | null; phone: string | null } | null;
  vehicle: {
    vehicle_number: string;
    type: string;
    brand: string;
    model: string;
    color: string;
  } | null;
}

/** Admin search: find QR codes by (partial) qr_id with full ownership details. */
export async function searchQRCodes(query: string): Promise<QRCodeSearchResult[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const q = query.trim().replace(/^SRQ-?/i, "");
  if (!q) return [];

  const adminClient = createAdminClient();
  const { data: codes } = await adminClient
    .from("ss_qr_codes")
    .select("*")
    .ilike("qr_id", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!codes || codes.length === 0) return [];

  const results: QRCodeSearchResult[] = [];
  for (const code of codes) {
    let vehicle = null;
    let owner = null;
    let agentName: string | null = null;

    if (code.vehicle_id) {
      const { data: v } = await adminClient
        .from("ss_vehicles")
        .select("vehicle_number, type, brand, model, color, owner_id")
        .eq("id", code.vehicle_id)
        .maybeSingle();
      if (v) {
        vehicle = {
          vehicle_number: v.vehicle_number,
          type: v.type,
          brand: v.brand,
          model: v.model,
          color: v.color,
        };
        const { data: u } = await adminClient
          .from("ss_users")
          .select("name, email, phone")
          .eq("id", v.owner_id)
          .maybeSingle();
        if (u) owner = { name: u.name, email: u.email, phone: u.phone };
      }
    }

    if (code.agent_id) {
      const { data: a } = await adminClient
        .from("ss_agents")
        .select("ss_users(name)")
        .eq("id", code.agent_id)
        .maybeSingle();
      agentName =
        (a?.ss_users as unknown as { name: string | null } | null)?.name ?? null;
    }

    results.push({ code, agentName, owner, vehicle });
  }
  return results;
}

export interface QRCodeOwnerDetail {
  owner: { name: string | null; email: string | null; phone: string | null } | null;
  vehicle: {
    vehicle_number: string;
    type: string;
    brand: string;
    model: string;
    color: string;
  } | null;
}

/** Vehicle + owner details for a single activated QR code (used by the batch admin list). */
export async function getQRCodeOwnerDetail(codeId: string): Promise<QRCodeOwnerDetail | null> {
  const guard = await assertAdmin();
  if (guard) return null;

  const adminClient = createAdminClient();
  const { data: code } = await adminClient
    .from("ss_qr_codes")
    .select("vehicle_id")
    .eq("id", codeId)
    .maybeSingle();

  if (!code?.vehicle_id) return { owner: null, vehicle: null };

  const { data: v } = await adminClient
    .from("ss_vehicles")
    .select("vehicle_number, type, brand, model, color, owner_id")
    .eq("id", code.vehicle_id)
    .maybeSingle();

  if (!v) return { owner: null, vehicle: null };

  const { data: u } = await adminClient
    .from("ss_users")
    .select("name, email, phone")
    .eq("id", v.owner_id)
    .maybeSingle();

  return {
    vehicle: { vehicle_number: v.vehicle_number, type: v.type, brand: v.brand, model: v.model, color: v.color },
    owner: u ? { name: u.name, email: u.email, phone: u.phone } : null,
  };
}

/**
 * Change the status of an already-taken QR code (issue resolution).
 * Deleting activated codes is deliberately impossible — status change is the
 * only allowed operation, and every change is written to the audit log.
 */
export async function changeQRCodeStatus(
  codeId: string,
  status: Extract<QRStatus, "active" | "suspended" | "lost">
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();
  const { data: code } = await adminClient
    .from("ss_qr_codes")
    .select("id, status")
    .eq("id", codeId)
    .single();

  if (!code) return { success: false, error: "QR code not found." };
  if (code.status === "unactivated") {
    return { success: false, error: "This code isn't activated yet — nothing to change." };
  }

  const { error } = await adminClient
    .from("ss_qr_codes")
    .update({
      status,
      suspended_at: status === "suspended" ? new Date().toISOString() : null,
    })
    .eq("id", codeId);

  if (error) return { success: false, error: error.message };

  await logAdminAction("change_qr_code_status", "ss_qr_codes", codeId, {
    from: code.status,
    to: status,
  });
  return { success: true };
}
