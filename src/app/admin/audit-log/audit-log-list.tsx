"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollText, Search } from "lucide-react";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/lib/use-pagination";
import type { AuditLogEntry } from "@/actions/audit-log";

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

export default function AuditLogList({ entries }: { entries: AuditLogEntry[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? entries.filter(
        (e) =>
          (actionLabels[e.action] ?? e.action).toLowerCase().includes(q) ||
          e.admin_name.toLowerCase().includes(q) ||
          (e.target_table ?? "").toLowerCase().includes(q)
      )
    : entries;
  const { page, totalPages, pageItems, setPage, totalItems, pageSize } = usePagination(filtered);

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <ScrollText className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No admin actions logged yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search action, admin, or table…"
          className="pl-9 h-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No entries match &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="grid gap-2">
          {pageItems.map((entry) => (
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
    </div>
  );
}
