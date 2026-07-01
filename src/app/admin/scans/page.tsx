import { getAllScans } from "@/actions/admin-scans";
import ScansTable from "./scans-table";

export const metadata = { title: "Scans" };

export default async function AdminScansPage() {
  const scans = await getAllScans();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scan Activity</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every scan across all QR stickers. Rows flagged when the same IP shows repeat activity.
        </p>
      </div>

      <ScansTable initialScans={scans} />
    </div>
  );
}
