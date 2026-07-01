"use server";

import { getCurrentUser } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/actions/audit-log";
import type { ActionResult, Coupon } from "@/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (user.role !== "admin") return { success: false, error: "Admin access required." };
  return null;
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const guard = await assertAdmin();
  if (guard) return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export interface CouponInput {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number;
  valid_until?: string;
}

export async function createCoupon(input: CouponInput): Promise<ActionResult<Coupon>> {
  const guard = await assertAdmin();
  if (guard) return { success: false, error: guard.error };

  const code = input.code.trim().toUpperCase();
  if (!code) return { success: false, error: "Enter a coupon code." };
  if (!Number.isInteger(input.discount_value) || input.discount_value <= 0) {
    return { success: false, error: "Enter a valid discount value." };
  }
  if (input.discount_type === "percentage" && input.discount_value > 100) {
    return { success: false, error: "Percentage discount cannot exceed 100." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("ss_coupons")
    .insert({
      code,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      max_uses: input.max_uses ?? null,
      valid_until: input.valid_until || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A coupon with this code already exists." };
    return { success: false, error: error.message };
  }
  await logAdminAction("create_coupon", "ss_coupons", data.id, { code, discount_type: input.discount_type });
  return { success: true, data };
}

export async function toggleCouponActive(couponId: string, isActive: boolean): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (guard) return guard;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("ss_coupons")
    .update({ is_active: isActive })
    .eq("id", couponId);

  if (error) return { success: false, error: error.message };
  await logAdminAction(isActive ? "activate_coupon" : "deactivate_coupon", "ss_coupons", couponId);
  return { success: true };
}
