"use client";

import { useState } from "react";
import { toast } from "sonner";
import Papa from "papaparse";
import { Wallet, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateCommissionStatus } from "@/actions/admin-commissions";
import { formatINR } from "@/lib/utils";
import type { CommissionWithAgent } from "@/actions/admin-commissions";
import type { CommissionStatus } from "@/types";

const statusStyles: Record<string, string> = {
  pending: "bg-gray-50 text-gray-600 border-gray-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const filters: { value: CommissionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

export default function CommissionsTable({
  initialCommissions,
}: {
  initialCommissions: CommissionWithAgent[];
}) {
  const [commissions, setCommissions] = useState(initialCommissions);
  const [filter, setFilter] = useState<CommissionStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = filter === "all" ? commissions : commissions.filter((c) => c.status === filter);

  async function handleStatusChange(id: string, status: CommissionStatus) {
    setUpdatingId(id);
    const result = await updateCommissionStatus(id, status);
    setUpdatingId(null);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update commission");
      return;
    }
    setCommissions((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status, paid_at: status === "paid" ? new Date().toISOString() : null } : c
      )
    );
    toast.success("Commission updated");
  }

  function handleExportCSV() {
    const rows = filtered.map((c) => ({
      agent_name: c.agent_name,
      referral_code: c.agent_referral_code,
      qr_id: c.qr_id,
      amount_inr: (c.amount / 100).toFixed(2),
      status: c.status,
      created_at: c.created_at,
      paid_at: c.paid_at ?? "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 rounded-lg border border-border p-1 bg-white">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === f.value ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium border border-border bg-white hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Wallet className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No commissions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{c.agent_name}</p>
                  <p className="text-sm text-gray-500 font-mono">
                    {c.agent_referral_code} · {c.qr_id}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatINR(c.amount)} · {new Date(c.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={statusStyles[c.status] ?? ""}>
                    {c.status}
                  </Badge>
                  {c.status === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === c.id}
                        onClick={() => handleStatusChange(c.id, "approved")}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === c.id}
                        onClick={() => handleStatusChange(c.id, "rejected")}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {(c.status === "approved" || c.status === "pending") && (
                    <button
                      type="button"
                      disabled={updatingId === c.id}
                      onClick={() => handleStatusChange(c.id, "paid")}
                      className="text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
