"use server";

import { createClient } from "@/lib/supabase/server";
import type { Plan, Subscription } from "@/types";

export async function getActivePlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true });

  return data ?? [];
}

export async function getMySubscription(): Promise<(Subscription & { plan: Plan }) | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ss_subscriptions")
    .select("*, ss_plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { ss_plans, ...subscription } = data;
  return { ...subscription, plan: ss_plans as unknown as Plan };
}
