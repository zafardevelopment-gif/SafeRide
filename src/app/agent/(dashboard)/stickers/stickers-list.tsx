"use client";

import { Fragment, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart3, QrCode, Search, ChevronDown } from "lucide-react";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/lib/use-pagination";
import StickerSquare from "@/app/admin/qr-batches/[id]/sticker-square";
import type { QRCode } from "@/types";

const statusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  unactivated: "bg-gray-50 text-gray-600 border-gray-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default function StickersList({ codes }: { codes: (QRCode & { has_been_scanned: boolean })[] }) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://saferide.aivexallp.com";

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
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-border bg-gray-50">
                <th className="font-medium py-2 px-3">QR code</th>
                <th className="font-medium py-2 px-3">Status</th>
                <th className="font-medium py-2 px-3">Created</th>
                <th className="font-medium py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((code) => {
                const isExpanded = expandedId === code.id;
                return (
                  <Fragment key={code.id}>
                    <tr
                      className="border-b border-border last:border-0 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(isExpanded ? null : code.id)}
                    >
                      <td className="py-2 px-3 font-mono text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          SRQ-{code.qr_id}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className={statusStyles[code.status] ?? ""}>
                          {code.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-gray-400 whitespace-nowrap">
                        {new Date(code.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-gray-400 inline-block transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border last:border-0">
                        <td colSpan={4} className="bg-gray-50 p-4">
                          <div className="max-w-xs mx-auto">
                            <StickerSquare code={code} appUrl={appUrl} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
    </div>
  );
}
