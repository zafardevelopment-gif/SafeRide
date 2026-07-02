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
        .select("role, name")
        .eq("id", data.user.id)
        .single();

      // No name yet means this is the first time we've seen this account —
      // send them to pick a role before landing in a dashboard.
      if (!profile?.name) {
        return NextResponse.redirect(`${origin}/signup/complete`);
      }

      if (profile.role === "agent") return NextResponse.redirect(`${origin}/agent`);
      if (profile.role === "admin") return NextResponse.redirect(`${origin}/admin`);
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
