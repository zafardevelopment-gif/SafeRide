"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { refundPayment } from "@/actions/admin-payments";
import { formatINR } from "@/lib/utils";
import type { PaymentWithUser } from "@/actions/admin-payments";
import type { Payment } from "@/types";

const statusStyles: Record<string, string> = {
  created: "bg-gray-50 text-gray-600 border-gray-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-amber-50 text-amber-700 border-amber-200",
};

const filters: { value: Payment["status"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "created", label: "Created" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export default function PaymentsTable({ initialPayments }: { initialPayments: PaymentWithUser[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [filter, setFilter] = useState<Payment["status"] | "all">("all");
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  async function handleRefund(id: string) {
    if (!confirm("Refund this payment via Razorpay?")) return;
    setRefundingId(id);
    const result = await refundPayment(id);
    setRefundingId(null);
    if (!result.success) {
      toast.error(result.error ?? "Refund failed");
      return;
    }
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "refunded" } : p)));
    toast.success("Payment refunded");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border border-border p-1 bg-white w-fit">
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

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Wallet className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No payments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{p.user_name}</p>
                  <p className="text-sm text-gray-500">{p.description ?? "Subscription"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatINR(p.total_amount)} · {new Date(p.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className={statusStyles[p.status] ?? ""}>
                    {p.status}
                  </Badge>
                  {p.status === "paid" && (
                    <button
                      type="button"
                      onClick={() => handleRefund(p.id)}
                      disabled={refundingId === p.id}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Refund
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
