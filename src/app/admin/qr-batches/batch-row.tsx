"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, ChevronRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteQRBatch } from "@/actions/qr-batch";
import type { QRBatch } from "@/types";

const printStatusStyles: Record<string, string> = {
  pending: "bg-gray-50 text-gray-600 border-gray-200",
  printed: "bg-blue-50 text-blue-700 border-blue-200",
  dispatched: "bg-green-50 text-green-700 border-green-200",
};

export default function BatchRow({ batch }: { batch: QRBatch & { agent_name: string | null } }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete this batch of ${batch.quantity} QR codes? This can't be undone.`)) return;

    setDeleting(true);
    const result = await deleteQRBatch(batch.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete batch");
      return;
    }
    toast.success("Batch deleted");
    router.refresh();
  }

  return (
    <Link href={`/admin/qr-batches/${batch.id}`}>
      <Card className="hover:border-blue-200 transition-colors">
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{batch.quantity} QR codes</p>
              <p className="text-sm text-gray-500 truncate">
                {batch.agent_name ? `Tagged to ${batch.agent_name}` : "Untagged"} ·{" "}
                {new Date(batch.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={printStatusStyles[batch.print_status] ?? ""}>
              {batch.print_status}
            </Badge>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete batch"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
