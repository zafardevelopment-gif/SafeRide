import { getAllAgentsWithStats } from "@/actions/admin-agents";
import { getCommissionAmount, getActivationFeeAmount } from "@/actions/settings";
import CommissionAmountForm from "./commission-amount-form";
import ActivationFeeForm from "./activation-fee-form";
import AgentsList from "./agents-list";

export const metadata = { title: "Agents" };

export default async function AdminAgentsPage() {
  const [agents, commissionAmount, activationFeeAmount] = await Promise.all([
    getAllAgentsWithStats(),
    getCommissionAmount(),
    getActivationFeeAmount(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Agents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Referral network — commission tracking and payouts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CommissionAmountForm currentAmountPaise={commissionAmount} />
        <ActivationFeeForm currentAmountPaise={activationFeeAmount} />
      </div>

      <AgentsList agents={agents} />
    </div>
  );
}
