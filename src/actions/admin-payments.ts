"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRefund } from "@/lib/razorpay";
import { logAdminAction } from "@/actions/audit-log";
import type { ActionResult, Payment, SubscriptionStatus } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export interface PaymentWithUser extends Payment {
  user_name: string;
  user_email: string | null;
}

export async function getAllPayments(): Promise<PaymentWithUser[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_payments")
    .select("*, ss_users(name, email)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((p) => {
    const user = p.ss_users as unknown as { name: string | null; email: string | null } | null;
    return {
      ...p,
      user_name: user?.name ?? "Unknown user",
      user_email: user?.email ?? null,
    };
  });
}

export async function refundPayment(paymentId: string): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();
  const { data: payment } = await adminClient
    .from("ss_payments")
    .select("id, razorpay_payment_id, status")
    .eq("id", paymentId)
    .single();

  if (!payment) return { success: false, error: "Payment not found." };
  if (payment.status !== "paid") return { success: false, error: "Only paid payments can be refunded." };
  if (!payment.razorpay_payment_id) return { success: false, error: "No Razorpay payment ID on record." };

  try {
    await createRefund(payment.razorpay_payment_id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Razorpay error";
    return { success: false, error: `Refund failed: ${message}` };
  }

  const { error } = await adminClient
    .from("ss_payments")
    .update({ status: "refunded" })
    .eq("id", paymentId);

  if (error) return { success: false, error: error.message };

  await logAdminAction("refund_payment", "ss_payments", paymentId);
  return { success: true };
}

export async function overrideSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("ss_subscriptions")
    .update({ status })
    .eq("id", subscriptionId);

  if (error) return { success: false, error: error.message };

  await logAdminAction("override_subscription", "ss_subscriptions", subscriptionId, { status });
  return { success: true };
}
