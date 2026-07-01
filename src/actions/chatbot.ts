"use server";

import { getCurrentUser } from "@/actions/auth";
import { getVehicles } from "@/actions/vehicle";
import { getMyCommissions, getMyQRBatches } from "@/actions/agent";
import { askChatbot } from "@/lib/openrouter";
import { faqs } from "@/lib/faq-data";
import { formatINR } from "@/lib/utils";
import type { ActionResult } from "@/types";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function buildFaqContext(): string {
  return faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
}

async function buildAccountContext(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) return "";

  const [vehicles, commissions, batches] = await Promise.all([
    getVehicles(),
    getMyCommissions(),
    getMyQRBatches(),
  ]);

  const lines = [`The visitor is logged in as ${user.name ?? "a customer"} (role: ${user.role}).`];

  if (vehicles.length > 0) {
    lines.push(
      `They have ${vehicles.length} vehicle(s): ${vehicles
        .map((v) => `${v.vehicle_number} (${v.brand} ${v.model}, sticker status: ${v.qr_code?.status ?? "not linked"})`)
        .join("; ")}.`
    );
  } else {
    lines.push("They have no vehicles registered yet.");
  }

  if (commissions.length > 0) {
    const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pending = commissions.filter((c) => c.status === "pending").length;
    lines.push(
      `They are an agent with ${commissions.length} commission record(s), total earned ${formatINR(totalEarned)}, ${pending} pending. They have generated ${batches.length} QR batch(es).`
    );
  }

  return lines.join(" ");
}

export async function sendChatMessage(
  history: ChatTurn[],
  message: string
): Promise<ActionResult<string>> {
  if (!message.trim()) return { success: false, error: "Type a message first." };

  const [faqContext, accountContext] = await Promise.all([
    Promise.resolve(buildFaqContext()),
    buildAccountContext(),
  ]);

  const systemPrompt = [
    "You are the support assistant for SafeRide QR, a service that lets Indian vehicle owners put a QR sticker on their vehicle so scanners can notify them, report parking issues, or trigger an emergency alert — without ever seeing the owner's phone number or personal details.",
    "Answer questions using the following FAQ knowledge as your primary source of truth:",
    faqContext,
    accountContext ? `Additional context about the current visitor's own account (only use this to answer questions about THEIR account, never imply this is about anyone else): ${accountContext}` : "The visitor is not logged in — you have no account-specific data for them.",
    "Keep answers short (2-4 sentences), friendly, and specific to SafeRide QR. If you don't know something, say so and suggest contacting support via the Contact page rather than guessing.",
  ].join("\n\n");

  const result = await askChatbot([
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ]);

  if (!result.success) return { success: false, error: result.error };
  return { success: true, data: result.reply };
}
