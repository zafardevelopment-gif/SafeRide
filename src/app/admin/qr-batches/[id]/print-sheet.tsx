"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer, Package, Trash2, FileDown, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StickerSquare from "./sticker-square";
import StickerStrip from "./sticker-strip";
import { deleteQRBatch } from "@/actions/qr-batch";
import { downloadStickerPdf } from "@/lib/sticker-pdf";
import type { QRBatch, QRCode } from "@/types";

interface BatchPrintSheetProps {
  batch: QRBatch;
  codes: QRCode[];
}

type Format = "square" | "strip";

export default function BatchPrintSheet({ batch, codes }: BatchPrintSheetProps) {
  const router = useRouter();
  const [format, setFormat] = useState<Format>("square");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://saferideqr.in";
  const activatedCount = codes.filter((c) => c.status !== "unactivated").length;

  async function handleDelete() {
    if (!confirm(`Delete this batch of ${batch.quantity} QR codes? This can't be undone.`)) return;
    setDeleting(true);
    const result = await deleteQRBatch(batch.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete batch");
      return;
    }
    toast.success("Batch deleted");
    router.push("/admin/qr-batches");
    router.refresh();
  }

  async function handleDownloadPdf() {
    setExporting(true);
    try {
      await downloadStickerPdf("ss-sticker-grid", format, `saferide-qr-stickers-${format}-${batch.id.slice(0, 8)}.pdf`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <Link
          href="/admin/qr-batches"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to batches
        </Link>
      </div>

      <Card className="print:hidden border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white ring-1 ring-blue-100 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{batch.quantity} QR codes</h1>
              <p className="text-sm text-gray-500">
                <span className="text-green-600 font-medium">{activatedCount} activated</span>
                {" · "}
                {batch.quantity - activatedCount} unactivated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-lg border border-border p-1 bg-white">
              {(["square", "strip"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                    format === f ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {f === "square" ? "Square 3.5×3.5\"" : "Strip 4×2\""}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors shrink-0"
            >
              <Printer className="w-4 h-4" />
              Print sheet
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm font-medium border border-border bg-white hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {exporting ? "Generating..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete batch"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {format === "square" ? (
        <div id="ss-sticker-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-2 print:gap-[0.25in]">
          {codes.map((code) => (
            <div
              key={code.id}
              className="ss-sticker-cell print:w-[3.5in]"
              style={{ width: 336 }}
            >
              <StickerSquare code={code} appUrl={appUrl} />
            </div>
          ))}
        </div>
      ) : (
        <div id="ss-sticker-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-1 print:gap-[0.2in]">
          {codes.map((code) => (
            <div
              key={code.id}
              className="ss-sticker-cell print:w-[4in]"
              style={{ width: 384, height: 192 }}
            >
              <StickerStrip code={code} appUrl={appUrl} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
