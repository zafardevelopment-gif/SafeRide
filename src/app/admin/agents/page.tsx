import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight, Banknote } from "lucide-react";
import { getAllAgentsWithStats } from "@/actions/admin-agents";
import { getCommissionAmount } from "@/actions/settings";
import { formatINR } from "@/lib/utils";
import CommissionAmountForm from "./commission-amount-form";

export const metadata = { title: "Agents" };

export default async function AdminAgentsPage() {
  const [agents, commissionAmount] = await Promise.all([
    getAllAgentsWithStats(),
    getCommissionAmount(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Agents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Referral network — commission tracking and payouts.
        </p>
      </div>

      <CommissionAmountForm currentAmountPaise={commissionAmount} />

      {agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No agents yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/admin/agents/${agent.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                        {agent.name}
                        {agent.withdrawal_requested_at && (
                          <Banknote className="w-3.5 h-3.5 text-blue-500 shrink-0" aria-label="Withdrawal requested" />
                        )}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">{agent.referral_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatINR(agent.total_commission_earned)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        {agent.pending_commission_count > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            {agent.pending_commission_count} pending
                          </Badge>
                        )}
                        {agent.withdrawal_requested_at && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            Withdrawal requested
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
