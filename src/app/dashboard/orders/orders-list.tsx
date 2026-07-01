"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { downloadInvoice } from "@/actions/checkout";
import { formatINR } from "@/lib/utils";
import type { Payment } from "@/types";

const statusStyles: Record<string, string> = {
  created: "bg-gray-50 text-gray-600 border-gray-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function OrdersList({ payments }: { payments: Payment[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(paymentId: string) {
    setDownloadingId(paymentId);
    const result = await downloadInvoice(paymentId);
    setDownloadingId(null);
    if (!result.success) {
      toast.error(result.error ?? "Failed to generate invoice");
      return;
    }
    const { base64, filename } = result.data!;
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (payments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No orders yet</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Your payment history will appear here after your first subscription payment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {payments.map((p) => (
        <Card key={p.id}>
          <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{formatINR(p.total_amount)}</p>
              <p className="text-sm text-gray-500">{p.description ?? "Subscription"}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(p.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="outline" className={statusStyles[p.status] ?? ""}>
                {p.status}
              </Badge>
              {p.status === "paid" && (
                <button
                  type="button"
                  onClick={() => handleDownload(p.id)}
                  disabled={downloadingId === p.id}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Invoice
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
