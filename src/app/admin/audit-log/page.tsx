import { getAuditLog } from "@/actions/audit-log";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export const metadata = { title: "Audit Log" };

const actionLabels: Record<string, string> = {
  update_user_role: "Updated user role",
  deactivate_user: "Deactivated user",
  reactivate_user: "Reactivated user",
  update_commission_status: "Updated commission status",
  update_commission_amount: "Updated commission amount",
  create_qr_batch: "Generated QR batch",
  create_coupon: "Created coupon",
  activate_coupon: "Activated coupon",
  deactivate_coupon: "Deactivated coupon",
};

export default async function AdminAuditLogPage() {
  const entries = await getAuditLog();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Record of admin actions across the platform.</p>
      </div>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <ScrollText className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No admin actions logged yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {actionLabels[entry.action] ?? entry.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.admin_name}
                    {entry.target_table ? ` · ${entry.target_table}` : ""}
                    {entry.target_id ? ` · ${entry.target_id.slice(0, 8)}` : ""}
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  {new Date(entry.created_at).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
