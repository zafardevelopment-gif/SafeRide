import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

export const metadata = { title: "Payout History" };

export default function AgentPayoutsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Payout History</h1>
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <History className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No payouts yet</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Admin marks commissions as paid after manual bank transfer. Your payout history will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
