import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";
import { getMyPayoutHistory, getMyBankDetails } from "@/actions/agent";
import { formatINR } from "@/lib/utils";
import BankDetailsForm from "@/components/agent/bank-details-form";

export const metadata = { title: "Payout History" };

export default async function AgentPayoutsPage() {
  const [payouts, bankDetails] = await Promise.all([getMyPayoutHistory(), getMyBankDetails()]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Payout History</h1>

      <BankDetailsForm initial={bankDetails} />

      {payouts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <History className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No payouts yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Admin marks commissions as paid after manual bank transfer. Your payout history will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {payouts.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{formatINR(p.amount)}</p>
                  <p className="text-sm text-gray-500 font-mono">{p.qr_id}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-IN") : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
