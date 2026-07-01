"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, QrCode, AlertCircle } from "lucide-react";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = "ss-qr-scanner-region";

// Html5Qrcode.stop() throws synchronously (not a rejected promise) if the
// scanner isn't currently running — e.g. permission was denied before start()
// resolved, or this runs twice (React StrictMode double-invokes effects in dev).
function safeStop(scanner: import("html5-qrcode").Html5Qrcode | null) {
  if (!scanner) return;
  try {
    const result = scanner.stop();
    if (result && typeof (result as Promise<void>).catch === "function") {
      (result as Promise<void>).catch(() => {});
    }
  } catch {
    // Not running — nothing to stop.
  }
}

function extractQrId(scannedValue: string): string {
  try {
    const url = new URL(scannedValue);
    const parts = url.pathname.split("/").filter(Boolean);
    const scanIndex = parts.indexOf("scan");
    if (scanIndex !== -1 && parts[scanIndex + 1]) return parts[scanIndex + 1];
  } catch {
    // Not a URL — treat the raw scanned text as the qr_id itself.
  }
  return scannedValue.trim();
}

export default function QrScannerModal({ open, onClose }: QrScannerModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            const qrId = extractQrId(decodedText);
            safeStop(scanner);
            onClose();
            router.push(`/scan/${qrId}`);
          },
          () => {
            // Per-frame "no QR found" callback — expected, not an error.
          }
        )
        .catch((err: Error) => {
          if (cancelled) return;
          const message = err.message?.toLowerCase().includes("permission")
            ? "Camera access was denied. Please allow camera permission and try again."
            : "Couldn't access a camera on this device.";
          setError(message);
        });
    });

    return () => {
      cancelled = true;
      safeStop(scannerRef.current);
      scannerRef.current = null;
    };
  }, [open, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <span className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-500" />
            Scan QR Sticker
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="py-10 flex flex-col items-center text-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : (
            <>
              <div id={SCANNER_ELEMENT_ID} className="w-full rounded-lg overflow-hidden bg-black" />
              <p className="text-xs text-gray-400 text-center mt-3">
                Point your camera at the QR sticker on your vehicle.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
