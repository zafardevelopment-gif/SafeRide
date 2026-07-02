import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from Supabase after Google OAuth.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("ss_users")
        .select("role, profile_completed")
        .eq("id", data.user.id)
        .single();

      // Google auto-fills raw_user_meta_data.name, so ss_users.name is never
      // null even for a brand-new account — profile_completed is the real
      // "have they picked a role yet" signal.
      if (!profile?.profile_completed) {
        return NextResponse.redirect(`${origin}/signup/complete`);
      }

      if (profile.role === "agent") return NextResponse.redirect(`${origin}/agent`);
      if (profile.role === "admin") return NextResponse.redirect(`${origin}/admin`);
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
