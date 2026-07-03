"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/lib/use-pagination";
import BatchRow from "./batch-row";
import type { QRBatch } from "@/types";

type BatchWithStats = QRBatch & { agent_name: string | null; activated_count: number };

export default function BatchesList({ batches }: { batches: BatchWithStats[] }) {
  const { page, totalPages, pageItems, setPage, totalItems, pageSize } = usePagination(batches);

  if (batches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <Package className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No batches generated yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {pageItems.map((batch) => (
          <BatchRow key={batch.id} batch={batch} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
    </div>
  );
}
