import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CopyButton from "@/components/shared/copy-button";
import { Link2, QrCode } from "lucide-react";

export const metadata = { title: "My Referral Link" };

export default async function AgentReferralPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("ss_agents")
    .select("referral_code")
    .eq("user_id", user.id)
    .single();

  if (!agent) redirect("/login");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://saferideqr.in";
  const referralUrl = `${appUrl}/agent/${agent.referral_code}`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">My Referral Link</h1>

      <Card>
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-800">Your public referral page</span>
          </div>
          <p className="text-sm text-gray-500">
            Share this link with anyone who wants to buy a SafeRide QR sticker online.
            Any activation via this link earns you commission automatically.
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-lg px-3 py-2">
            <code className="flex-1 text-sm text-gray-700 break-all">{referralUrl}</code>
            <CopyButton text={referralUrl} />
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Your unique code</p>
              <p className="text-xs text-gray-400 mt-0.5">
                This is pre-tagged on every sticker batch assigned to you.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-base tracking-widest px-3">
                {agent.referral_code}
              </Badge>
              <CopyButton text={agent.referral_code} label="Copy" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp share message */}
      <Card className="bg-green-50 border-green-100">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-semibold text-green-800 mb-2">
            💬 Suggested WhatsApp message
          </p>
          <p className="text-sm text-green-700 whitespace-pre-line">
            {`🛡️ Protect your bike/car with a smart QR sticker!\n\nIf someone scans it, you get an instant alert — without sharing your number.\n\n✅ Works on any phone\n✅ Emergency mode with location\n✅ No app needed\n\nActivate yours here 👇\n${referralUrl}`}
          </p>
          <div className="mt-3">
            <CopyButton
              text={`🛡️ Protect your bike/car with a smart QR sticker!\n\nIf someone scans it, you get an instant alert — without sharing your number.\n\n✅ Works on any phone\n✅ Emergency mode with location\n✅ No app needed\n\nActivate yours here 👇\n${referralUrl}`}
              label="Copy message"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
