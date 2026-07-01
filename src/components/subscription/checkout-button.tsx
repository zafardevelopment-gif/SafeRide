"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { createCheckoutOrder, confirmPayment } from "@/actions/checkout";
import type { RazorpayOptions, RazorpayResponse } from "@/types";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface CheckoutButtonProps {
  planId: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  couponCode?: string;
  customerName?: string | null;
  customerEmail?: string | null;
  className?: string;
}

export default function CheckoutButton({
  planId,
  planName,
  billingCycle,
  couponCode,
  customerName,
  customerEmail,
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  async function handleCheckout() {
    if (!scriptReady || typeof window.Razorpay === "undefined") {
      toast.error("Payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setLoading(true);
    const order = await createCheckoutOrder(planId, billingCycle, couponCode);
    if (!order.success) {
      setLoading(false);
      toast.error(order.error ?? "Failed to start checkout");
      return;
    }

    const { orderId, amount, currency, razorpayKeyId, paymentId } = order.data!;

    const razorpay = new window.Razorpay({
      key: razorpayKeyId,
      amount,
      currency,
      name: process.env.NEXT_PUBLIC_APP_NAME ?? "SafeRide QR",
      description: `${planName} — ${billingCycle}`,
      order_id: orderId,
      prefill: {
        name: customerName ?? undefined,
        email: customerEmail ?? undefined,
      },
      theme: { color: "#2563eb" },
      handler: async (response: RazorpayResponse) => {
        const result = await confirmPayment(
          paymentId,
          planId,
          billingCycle,
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          couponCode
        );
        setLoading(false);
        if (!result.success) {
          toast.error(result.error ?? "Payment confirmation failed");
          return;
        }
        toast.success(`You're now on ${planName}!`);
        router.push("/dashboard/orders");
        router.refresh();
      },
    });

    razorpay.open();
    setLoading(false);
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
        }
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Upgrade
      </button>
    </>
  );
}
