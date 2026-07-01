import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link2, QrCode, Wallet, Copy, BarChart3 } from "lucide-react";
import CopyButton from "@/components/shared/copy-button";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Agent Dashboard" };

async function getAgentData(userId: string) {
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("ss_agents")
    .select("id, referral_code, total_commission_earned, total_commission_paid")
    .eq("user_id", userId)
    .single();

  if (!agent) return null;

  const [batchesRes, commissionsRes] = await Promise.all([
    supabase
      .from("ss_qr_batches")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agent.id),
    supabase
      .from("ss_commissions")
      .select("id, status", { count: "exact" })
      .eq("agent_id", agent.id),
  ]);

  const commissions = commissionsRes.data ?? [];
  const activatedCount = commissions.filter((c) => c.status !== "rejected").length;
  const pendingCount = commissions.filter((c) => c.status === "pending").length;

  return {
    referralCode: agent.referral_code,
    totalEarned: agent.total_commission_earned,
    totalPaid: agent.total_commission_paid,
    batchCount: batchesRes.count ?? 0,
    activatedCount,
    pendingCount,
  };
}

export default async function AgentPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const agentData = await getAgentData(user.id);

  if (!agentData) {
    // ss_agents row missing — shouldn't happen but handle gracefully
    redirect("/login");
  }

  const firstName = user.name?.split(" ")[0] ?? "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://saferideqr.in";
  const referralUrl = `${appUrl}/agent/${agentData.referralCode}`;
  const pendingPayout = agentData.totalEarned - agentData.totalPaid;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's your sales and commission overview.
        </p>
      </div>

      {/* Referral code card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold text-blue-700">Your Referral Link</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white border border-blue-100 rounded-lg px-3 py-2 text-gray-700 truncate">
              {referralUrl}
            </code>
            <CopyButton text={referralUrl} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Share this link on WhatsApp. Any purchase via this link earns you commission automatically.
          </p>
          <Separator className="my-3" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Your code:</span>
            <Badge variant="secondary" className="font-mono text-sm tracking-widest">
              {agentData.referralCode}
            </Badge>
            <CopyButton text={agentData.referralCode} label="Copy code" />
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Sticker Batches",
            value: agentData.batchCount,
            icon: <QrCode className="w-5 h-5 text-blue-500" />,
            color: "bg-blue-50",
          },
          {
            label: "Activations",
            value: agentData.activatedCount,
            icon: <BarChart3 className="w-5 h-5 text-green-500" />,
            color: "bg-green-50",
          },
          {
            label: "Total Earned",
            value: formatINR(agentData.totalEarned),
            icon: <Wallet className="w-5 h-5 text-purple-500" />,
            color: "bg-purple-50",
          },
          {
            label: "Pending Payout",
            value: formatINR(pendingPayout),
            icon: <Wallet className="w-5 h-5 text-orange-500" />,
            color: "bg-orange-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className={`border-0 ${stat.color}`}>
            <CardContent className="pt-4 pb-3">
              <div className="mb-2">{stat.icon}</div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending commissions notice */}
      {agentData.pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 flex items-center gap-3">
            <Wallet className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              You have <strong>{agentData.pendingCount} pending commission{agentData.pendingCount > 1 ? "s" : ""}</strong> awaiting admin approval.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {agentData.activatedCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <QrCode className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No activations yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Share your referral link or hand out QR stickers. You'll earn commission for every activation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
