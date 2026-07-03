import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Banknote, CreditCard, Scale } from "lucide-react";
import { getMyBillingSummary, getMyWithdrawalRequestedAt } from "@/actions/agent";
import { formatINR } from "@/lib/utils";
import WithdrawalRequestButton from "@/components/agent/withdrawal-request-button";

export const metadata = { title: "My Billing" };

const statusStyles: Record<string, string> = {
  pending: "bg-gray-50 text-gray-600 border-gray-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default async function AgentBillingPage() {
  const [summary, withdrawalRequestedAt] = await Promise.all([
    getMyBillingSummary(),
    getMyWithdrawalRequestedAt(),
  ]);
  const owesSafeRide = summary.netSettlement < 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-500" />
          My Billing
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          A breakdown of what you sold in cash vs online, and the net settlement between you and
          SafeRide.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">Cash sales</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.cashSales.count}</p>
            <p className="text-xs text-gray-400 mt-1">activations you collected cash for</p>
            <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Your commission</span>
                <span className="font-medium text-gray-900">
                  {formatINR(summary.cashSales.commissionEarned)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">You owe SafeRide</span>
                <span className="font-medium text-red-600">
                  {formatINR(summary.cashSales.owedToSafeRide)}
                </span>
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
            <p className="text-2xl font-bold text-gray-900">{summary.onlineSales.count}</p>
            <p className="text-xs text-gray-400 mt-1">customers paid SafeRide directly</p>
            <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Your commission</span>
                <span className="font-medium text-gray-900">
                  {formatINR(summary.onlineSales.commissionEarned)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SafeRide owes you</span>
                <span className="font-medium text-green-600">
                  {formatINR(summary.onlineSales.owedBySafeRide)}
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
            {formatINR(Math.abs(summary.netSettlement))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {owesSafeRide
              ? "You owe this much to SafeRide (from cash sales, net of your commission)."
              : "SafeRide owes you this much (net of what you owe from cash sales)."}
          </p>
          {!owesSafeRide && summary.netSettlement > 0 && (
            <div className="mt-4">
              <WithdrawalRequestButton initialRequestedAt={withdrawalRequestedAt} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h2 className="font-bold text-gray-900 mb-3">All Activations</h2>
          {summary.commissions.length === 0 ? (
            <p className="text-sm text-gray-400">No activations yet.</p>
          ) : (
            <div className="space-y-2">
              {summary.commissions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {c.channel === "cash" ? (
                      <Banknote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{formatINR(c.amount)}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.qr_id}</p>
                    </div>
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
