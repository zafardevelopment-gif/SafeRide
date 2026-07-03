import { getAllAgentsWithStats } from "@/actions/admin-agents";
import { getCommissionAmount } from "@/actions/settings";
import CommissionAmountForm from "./commission-amount-form";
import AgentsList from "./agents-list";

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

      <AgentsList agents={agents} />
    </div>
  );
}
