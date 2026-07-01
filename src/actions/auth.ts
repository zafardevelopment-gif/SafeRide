"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

// ----------------------------------------------------------------
// Simple email + password auth (current default — OTP flow below is
// kept for later; re-enable once the rest of the system is final).
// ----------------------------------------------------------------

export async function signUpWithPassword(formData: {
  name: string;
  email: string;
  password: string;
  role: "customer" | "agent";
  referralCode?: string;
}): Promise<ActionResult<{ role: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.email.toLowerCase().trim(),
    password: formData.password,
  });

  if (error) {
    console.error("[signUpWithPassword] auth.signUp error:", error);
    return { success: false, error: error.message || "Signup failed (auth)." };
  }
  if (!data.user) return { success: false, error: "Signup failed. Please try again." };

  const adminClient = createAdminClient();

  // A bad/unknown ?ref= shouldn't block signup — resolve it best-effort.
  let referredByAgentId: string | null = null;
  if (formData.referralCode) {
    const { data: referringAgent } = await adminClient
      .from("ss_agents")
      .select("id")
      .eq("referral_code", formData.referralCode.toUpperCase().trim())
      .maybeSingle();
    referredByAgentId = referringAgent?.id ?? null;
  }

  const { error: profileError } = await adminClient
    .from("ss_users")
    .update({
      name: formData.name.trim(),
      role: formData.role,
      referred_by_agent_id: referredByAgentId,
    })
    .eq("id", data.user.id);

  if (profileError) {
    console.error("[signUpWithPassword] ss_users update error:", profileError);
    return { success: false, error: profileError.message || "Signup failed (profile)." };
  }

  if (formData.role === "agent") {
    const { error: agentError } = await adminClient
      .from("ss_agents")
      .insert({ user_id: data.user.id })
      .select()
      .single();

    if (agentError && agentError.code !== "23505") {
      console.error("[signUpWithPassword] ss_agents insert error:", agentError);
      return { success: false, error: agentError.message || "Signup failed (agent)." };
    }
  }

  return { success: true, data: { role: formData.role } };
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<ActionResult<{ role: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) return { success: false, error: "Invalid email or password." };
  if (!data.user) return { success: false, error: "Login failed. Please try again." };

  const { data: profile } = await supabase
    .from("ss_users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return { success: true, data: { role: profile?.role ?? "customer" } };
}

// ----------------------------------------------------------------
// OTP auth — disabled for now, kept for future re-enable.
// ----------------------------------------------------------------

// Send OTP to email — Supabase Auth handles delivery
export async function sendOTP(email: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: undefined, // we verify manually via token, not magic link
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Verify OTP entered by user
export async function verifyOTP(
  email: string,
  token: string
): Promise<ActionResult<{ role: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.toLowerCase().trim(),
    token: token.trim(),
    type: "email",
  });

  if (error) return { success: false, error: "Invalid or expired OTP. Please try again." };
  if (!data.user) return { success: false, error: "Verification failed. Please try again." };

  // Fetch the user's role from ss_users
  const { data: profile } = await supabase
    .from("ss_users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return { success: true, data: { role: profile?.role ?? "customer" } };
}

// Complete signup — update name, phone, role in ss_users
// Called after OTP is verified on the signup flow
export async function completeSignup(formData: {
  name: string;
  phone: string;
  role: "customer" | "agent";
}): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  const adminClient = createAdminClient();

  // Update profile
  const { error: profileError } = await adminClient
    .from("ss_users")
    .update({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
    })
    .eq("id", user.id);

  if (profileError) return { success: false, error: profileError.message };

  // If agent role, create the ss_agents record
  if (formData.role === "agent") {
    const { error: agentError } = await adminClient
      .from("ss_agents")
      .insert({ user_id: user.id })
      .select()
      .single();

    // Ignore unique violation — row may already exist
    if (agentError && agentError.code !== "23505") {
      return { success: false, error: agentError.message };
    }
  }

  return { success: true };
}

// Sign out
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Get current user profile — used in layouts
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("ss_users")
    .select("id, name, email, phone, role, avatar_url")
    .eq("id", user.id)
    .single();

  return profile;
}
