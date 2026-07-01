import { getAllCoupons } from "@/actions/admin-coupons";
import CouponsPanel from "./coupons-panel";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await getAllCoupons();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
        <p className="text-sm text-gray-500 mt-1">Discount codes for future checkout.</p>
      </div>

      <CouponsPanel initialCoupons={coupons} />
    </div>
  );
}
