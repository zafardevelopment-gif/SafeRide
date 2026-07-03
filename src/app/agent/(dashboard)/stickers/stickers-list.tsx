"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart3, QrCode, Search } from "lucide-react";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/lib/use-pagination";
import type { QRCode } from "@/types";

const statusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  unactivated: "bg-gray-50 text-gray-600 border-gray-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default function StickersList({ codes }: { codes: QRCode[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? codes.filter((c) => c.qr_id.toLowerCase().includes(q)) : codes;
  const { page, totalPages, pageItems, setPage, totalItems, pageSize } = usePagination(filtered);

  if (codes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <BarChart3 className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No stickers tagged to you yet</p>
          <p className="text-sm text-gray-400 max-w-xs">
            When an admin tags a sticker to you — whether at batch generation or individually — it
            will show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activatedCount = codes.filter((c) => c.status !== "unactivated").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{codes.length}</span> stickers ·{" "}
          <span className="text-green-600 font-medium">{activatedCount} activated</span>
        </p>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search QR code…"
            className="pl-9 h-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No stickers match &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="grid gap-2">
          {pageItems.map((code) => (
            <Card key={code.id}>
              <CardContent className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-mono text-sm text-gray-900">SRQ-{code.qr_id}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(code.created_at).toLocaleDateString("en-IN")}
                  </span>
                  <Badge variant="outline" className={statusStyles[code.status] ?? ""}>
                    {code.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
    </div>
  );
}
