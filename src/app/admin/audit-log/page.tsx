import { getAuditLog } from "@/actions/audit-log";
import AuditLogList from "./audit-log-list";

export const metadata = { title: "Audit Log" };

export default async function AdminAuditLogPage() {
  const entries = await getAuditLog();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Record of admin actions across the platform.</p>
      </div>

      <AuditLogList entries={entries} />
    </div>
  );
}
