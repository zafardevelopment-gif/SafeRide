import { getMyPayments } from "@/actions/checkout";
import OrdersList from "./orders-list";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const payments = await getMyPayments();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>
      <OrdersList payments={payments} />
    </div>
  );
}
