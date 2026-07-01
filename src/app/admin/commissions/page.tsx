import { getAllCommissions } from "@/actions/admin-commissions";
import CommissionsTable from "./commissions-table";

export const metadata = { title: "Commissions" };

export default async function AdminCommissionsPage() {
  const commissions = await getAllCommissions();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Commissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Approve and mark agent commissions as paid after manual payout.
        </p>
      </div>

      <CommissionsTable initialCommissions={commissions} />
    </div>
  );
}
