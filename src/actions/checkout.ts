"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { validateCoupon } from "@/actions/coupons";
import { generateInvoicePDF } from "@/lib/invoice";
import type { ActionResult, Payment } from "@/types";

const GST_PERCENTAGE = Number(process.env.GST_PERCENTAGE ?? 18);

export async function createCheckoutOrder(
  planId: string,
  billingCycle: "monthly" | "yearly",
  couponCode?: string
): Promise<
  ActionResult<{
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
    paymentId: string;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: plan } = await supabase
    .from("ss_plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .single();
  if (!plan) return { success: false, error: "Plan not found." };

  const basePrice = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  if (basePrice <= 0) return { success: false, error: "This plan doesn't require payment." };

  let amount = basePrice;
  let appliedCouponCode: string | null = null;
  if (couponCode) {
    const validation = await validateCoupon(couponCode, planId, basePrice);
    if (!validation.success) return { success: false, error: validation.error };
    amount = Math.max(0, basePrice - validation.data!.discountPaise);
    appliedCouponCode = validation.data!.coupon.code;
  }

  const gstAmount = Math.round((amount * GST_PERCENTAGE) / 100);
  const totalAmount = amount + gstAmount;

  const adminClient = createAdminClient();

  let order;
  try {
    order = await createOrder(totalAmount, `sub_${user.id.slice(0, 8)}_${Date.now()}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Razorpay error";
    return { success: false, error: `Failed to create payment order: ${message}` };
  }

  const { data: payment, error } = await adminClient
    .from("ss_payments")
    .insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      status: "created",
      description: `${plan.name} — ${billingCycle}${appliedCouponCode ? ` (coupon: ${appliedCouponCode})` : ""}`,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      orderId: order.id,
      amount: totalAmount,
      currency: "INR",
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      paymentId: payment.id,
    },
  };
}

export async function confirmPayment(
  paymentId: string,
  planId: string,
  billingCycle: "monthly" | "yearly",
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  couponCode?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return { success: false, error: "Payment verification failed." };
  }

  const adminClient = createAdminClient();

  const { data: payment } = await adminClient
    .from("ss_payments")
    .select("*")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (!payment) return { success: false, error: "Payment record not found." };
  if (payment.status === "paid") return { success: true }; // already confirmed (e.g. via webhook)

  const { data: plan } = await adminClient.from("ss_plans").select("*").eq("id", planId).single();
  if (!plan) return { success: false, error: "Plan not found." };

  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  // No unique constraint on user_id — a user may have historical rows from
  // past plans, so find-or-create against their current active row instead
  // of relying on an upsert conflict target.
  const { data: existingSubscription } = await adminClient
    .from("ss_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const subscriptionFields = {
    plan_id: planId,
    status: "active" as const,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
  };

  const { data: subscription, error: subError } = existingSubscription
    ? await adminClient
        .from("ss_subscriptions")
        .update(subscriptionFields)
        .eq("id", existingSubscription.id)
        .select()
        .single()
    : await adminClient
        .from("ss_subscriptions")
        .insert({ user_id: user.id, ...subscriptionFields })
        .select()
        .single();

  if (subError) return { success: false, error: subError.message };

  const { error: paymentError } = await adminClient
    .from("ss_payments")
    .update({
      razorpay_payment_id: razorpayPaymentId,
      subscription_id: subscription.id,
      status: "paid",
    })
    .eq("id", paymentId);

  if (paymentError) return { success: false, error: paymentError.message };

  if (couponCode) {
    const { data: coupon } = await adminClient
      .from("ss_coupons")
      .select("id, used_count")
      .eq("code", couponCode.trim().toUpperCase())
      .maybeSingle();
    if (coupon) {
      await adminClient
        .from("ss_coupons")
        .update({ used_count: coupon.used_count + 1 })
        .eq("id", coupon.id);
    }
  }

  return { success: true };
}

export async function getMyPayments(): Promise<Payment[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ss_payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function downloadInvoice(paymentId: string): Promise<ActionResult<{ base64: string; filename: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: payment } = await supabase
    .from("ss_payments")
    .select("*")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .single();
  if (!payment) return { success: false, error: "Payment not found." };

  const { data: profile } = await supabase
    .from("ss_users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  let planName = "Subscription";
  if (payment.subscription_id) {
    const { data: sub } = await supabase
      .from("ss_subscriptions")
      .select("ss_plans(name)")
      .eq("id", payment.subscription_id)
      .maybeSingle();
    const plan = sub?.ss_plans as unknown as { name: string } | null;
    if (plan?.name) planName = plan.name;
  }

  const pdfBuffer = generateInvoicePDF({
    payment,
    customerName: profile?.name ?? "Customer",
    customerEmail: profile?.email ?? null,
    planName,
  });

  return {
    success: true,
    data: {
      base64: pdfBuffer.toString("base64"),
      filename: `invoice-${payment.id.slice(0, 8)}.pdf`,
    },
  };
}
