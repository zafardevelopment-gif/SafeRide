import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldOff } from "lucide-react";

export const metadata = { title: "SafeRide QR" };

async function getAgentByReferralCode(referralCode: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("ss_agents")
    .select("id, referral_code, ss_users!ss_agents_user_id_fkey(name)")
    .eq("referral_code", referralCode.toUpperCase())
    .maybeSingle();

  if (!data) return null;
  const name = (data.ss_users as unknown as { name: string | null } | null)?.name ?? "your local agent";
  return { referralCode: data.referral_code, name };
}

export default async function AgentReferralLandingPage({
  params,
}: {
  params: Promise<{ referral_code: string }>;
}) {
  const { referral_code } = await params;
  const agent = await getAgentByReferralCode(referral_code);

  if (!agent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-blue-50 to-white">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <ShieldOff className="w-10 h-10 text-gray-300" />
            <p className="font-semibold text-gray-700">Invalid referral link</p>
            <p className="text-sm text-gray-400">
              This referral code doesn't match any SafeRide QR agent.
            </p>
            <Link href="/" className="mt-2 text-sm text-blue-600 hover:underline font-medium">
              Go to homepage
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const signupUrl = `/signup?ref=${agent.referralCode}`;

  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-blue-600 text-lg tracking-tight">SafeRide QR</span>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg px-3 h-7 text-sm font-medium hover:bg-muted transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
        <Badge variant="secondary" className="mb-4">
          Referred by {agent.name}
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight max-w-2xl">
          Your vehicle speaks.{" "}
          <span className="text-blue-600">You stay safe.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl">
          Stick a smart QR on your bike, car, or scooter. When someone scans it,
          you get an instant alert — without ever sharing your phone number.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={signupUrl}
            className="inline-flex items-center justify-center rounded-lg px-5 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Sign up",
                desc: "Create your account — it's linked to your referring agent automatically.",
                icon: "📝",
              },
              {
                step: "2",
                title: "Scan & Activate",
                desc: "Scan your sticker with any phone camera. Fill in your vehicle and emergency details in 2 minutes.",
                icon: "📱",
              },
              {
                step: "3",
                title: "Stay Protected",
                desc: "Anyone who scans your sticker can alert you or emergency contacts — without seeing your number.",
                icon: "🛡️",
              },
            ].map((item) => (
              <Card key={item.step} className="text-center border-0 shadow-sm">
                <CardContent className="pt-8 pb-6">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">
                    Step {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to protect your vehicle?</h2>
        <p className="text-blue-100 mb-8 max-w-md mx-auto">
          Sign up now — {agent.name} gets credit for referring you.
        </p>
        <Link
          href={signupUrl}
          className="inline-flex items-center justify-center rounded-lg px-6 h-10 font-medium bg-white text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Get Started →
        </Link>
      </section>

      <footer className="border-t py-6 px-4 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} SafeRide QR. All rights reserved.</p>
      </footer>
    </main>
  );
}
