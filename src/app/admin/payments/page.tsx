import { getAllPayments } from "@/actions/admin-payments";
import PaymentsTable from "./payments-table";

export const metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">All subscription payments across customers.</p>
      </div>

      <PaymentsTable initialPayments={payments} />
    </div>
  );
}
