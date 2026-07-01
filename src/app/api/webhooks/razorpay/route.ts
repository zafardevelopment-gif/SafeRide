import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Server-side safety net for the client-side confirmPayment() flow in
// src/actions/checkout.ts — catches payment failures and subscription
// cancellations even if the customer closes the browser mid-checkout.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event as string;
  const adminClient = createAdminClient();

  if (event === "payment.failed") {
    const orderId = payload.payload?.payment?.entity?.order_id as string | undefined;
    if (orderId) {
      await adminClient
        .from("ss_payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", orderId)
        .eq("status", "created");
    }
  }

  if (event === "subscription.cancelled") {
    const razorpaySubscriptionId = payload.payload?.subscription?.entity?.id as string | undefined;
    if (razorpaySubscriptionId) {
      await adminClient
        .from("ss_subscriptions")
        .update({ status: "cancelled" })
        .eq("razorpay_subscription_id", razorpaySubscriptionId);
    }
  }

  return NextResponse.json({ received: true });
}
