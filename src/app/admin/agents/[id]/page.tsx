import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Wallet, Package, Banknote, CreditCard, Scale } from "lucide-react";
import { getAgentDetail } from "@/actions/admin-agents";
import { getAgentBillingSummaryAdmin } from "@/actions/agent";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import AgentSettingsForm from "./agent-settings-form";

export const metadata = { title: "Agent Detail" };

const statusStyles: Record<string, string> = {
  pending: "bg-gray-50 text-gray-600 border-gray-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default async function AdminAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentDetail(id);
  if (!agent) notFound();

  const adminClient = createAdminClient();
  const [{ data: commissions }, billing] = await Promise.all([
    adminClient.from("ss_commissions").select("*").eq("agent_id", id).order("created_at", { ascending: false }),
    getAgentBillingSummaryAdmin(id),
  ]);
  const owesSafeRide = billing.netSettlement < 0;

  return (
    <div className="space-y-4">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to agents
      </Link>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {agent.name}
                {agent.withdrawal_requested_at && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-normal">
                    Withdrawal requested {new Date(agent.withdrawal_requested_at).toLocaleDateString("en-IN")}
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-gray-500">
                {agent.email} · <span className="font-mono">{agent.referral_code}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-gray-400">Batches</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                {agent.batch_count}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total earned</p>
              <p className="font-semibold text-gray-900">{formatINR(agent.total_commission_earned)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total paid</p>
              <p className="font-semibold text-gray-900">{formatINR(agent.total_commission_paid)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AgentSettingsForm
        agentId={agent.id}
        commissionAmountPaise={agent.commission_amount_paise}
        bankAccountName={agent.bank_account_name}
        bankAccountNumber={agent.bank_account_number}
        bankIfsc={agent.bank_ifsc}
        upiId={agent.upi_id}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">Cash sales</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{billing.cashSales.count}</p>
            <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Agent's commission</span>
                <span className="font-medium text-gray-900">{formatINR(billing.cashSales.commissionEarned)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agent owes SafeRide</span>
                <span className="font-medium text-red-600">{formatINR(billing.cashSales.owedToSafeRide)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-semibold text-gray-900">Online sales</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{billing.onlineSales.count}</p>
            <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Agent's commission</span>
                <span className="font-medium text-gray-900">
                  {formatINR(billing.onlineSales.commissionEarned)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SafeRide owes agent</span>
                <span className="font-medium text-green-600">
                  {formatINR(billing.onlineSales.owedBySafeRide)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={owesSafeRide ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Scale className={`w-4 h-4 ${owesSafeRide ? "text-red-500" : "text-green-600"}`} />
            <p className="text-sm font-semibold text-gray-900">Net settlement</p>
          </div>
          <p className={`text-2xl font-bold ${owesSafeRide ? "text-red-600" : "text-green-700"}`}>
            {formatINR(Math.abs(billing.netSettlement))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {owesSafeRide ? "Agent owes SafeRide this amount." : "SafeRide owes this agent this amount."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-gray-400" />
            Commissions
          </h2>
          {!commissions || commissions.length === 0 ? (
            <p className="text-sm text-gray-400">No commissions yet.</p>
          ) : (
            <div className="space-y-2">
              {commissions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{formatINR(c.amount)}</p>
                    <p className="text-xs text-gray-400 font-mono">{c.qr_id}</p>
                  </div>
                  <Badge variant="outline" className={statusStyles[c.status] ?? ""}>
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
