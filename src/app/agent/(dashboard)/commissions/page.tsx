import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { getMyCommissions } from "@/actions/agent";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Commission Earned" };

const statusStyles: Record<string, string> = {
  pending: "bg-gray-50 text-gray-600 border-gray-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default async function AgentCommissionsPage() {
  const commissions = await getMyCommissions();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Commission Earned</h1>

      {commissions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Wallet className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No commissions yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Commissions are created automatically when a QR sticker tagged to you is activated by a customer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {commissions.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{formatINR(c.amount)}</p>
                  <p className="text-sm text-gray-500 font-mono">{c.qr_id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(c.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Badge variant="outline" className={statusStyles[c.status] ?? ""}>
                  {c.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
