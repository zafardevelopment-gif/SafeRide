"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Coupon } from "@/types";

export interface CouponValidation {
  coupon: Coupon;
  discountPaise: number;
}

// Read-only check — does not increment used_count. That happens only once
// a payment actually completes (see confirmPayment in checkout.ts), so an
// abandoned checkout never consumes a use.
export async function validateCoupon(
  code: string,
  planId: string,
  amountPaise: number
): Promise<ActionResult<CouponValidation>> {
  const supabase = await createClient();
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { success: false, error: "Enter a coupon code." };

  const { data: coupon } = await supabase
    .from("ss_coupons")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) return { success: false, error: "Invalid coupon code." };

  const now = new Date();
  if (new Date(coupon.valid_from) > now) {
    return { success: false, error: "This coupon isn't active yet." };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { success: false, error: "This coupon has expired." };
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { success: false, error: "This coupon has reached its usage limit." };
  }
  if (coupon.plan_id && coupon.plan_id !== planId) {
    return { success: false, error: "This coupon isn't valid for the selected plan." };
  }

  const discountPaise =
    coupon.discount_type === "percentage"
      ? Math.round((amountPaise * coupon.discount_value) / 100)
      : Math.min(coupon.discount_value, amountPaise);

  return { success: true, data: { coupon, discountPaise } };
}
