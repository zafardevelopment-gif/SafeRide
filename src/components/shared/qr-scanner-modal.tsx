"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, QrCode, AlertCircle, RefreshCw } from "lucide-react";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  /** Defaults to navigating to /scan/[qrId]. Pass this to handle the scanned qr_id yourself instead. */
  onDecode?: (qrId: string) => void;
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

// html5-qrcode rejects with Error objects OR plain strings. Normalise, then
// map to a friendly, actionable message.
function friendlyError(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const text = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();

  if (name === "NotAllowedError" || text.includes("permission") || text.includes("denied")) {
    return "Camera permission is blocked for this website. Tap the lock icon 🔒 in your browser's address bar → Permissions → allow Camera, then try again.";
  }
  if (name === "NotReadableError" || text.includes("in use") || text.includes("could not start")) {
    return "Camera is busy — another app may be using it. Close other camera apps and try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || text.includes("no camera") || text.includes("not found")) {
    return "No usable camera was found on this device.";
  }
  if (name === "SecurityError" || text.includes("secure")) {
    return "Camera needs a secure (https) connection. Please open the site with https://";
  }
  return "Couldn't access the camera. Please check camera permission for this site and try again.";
}

export default function QrScannerModal({ open, onClose, onDecode: onDecodeProp }: QrScannerModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);

    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      // Guards against the element having been unmounted by the time this
      // async import resolves (e.g. React StrictMode's dev-mode double
      // effect invoke, or the modal closing before the chunk loads).
      if (!document.getElementById(SCANNER_ELEMENT_ID)) return;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 240, height: 240 } };
      const onDecode = (decodedText: string) => {
        const qrId = extractQrId(decodedText);
        safeStop(scanner);
        onClose();
        if (onDecodeProp) onDecodeProp(qrId);
        else router.push(`/scan/${qrId}`);
      };
      const noop = () => {
        // Per-frame "no QR found" callback — expected, not an error.
      };

      try {
        // 1st attempt: prefer the back camera.
        await scanner.start({ facingMode: "environment" }, config, onDecode, noop);
      } catch (firstErr) {
        if (cancelled) return;
        try {
          // Fallback: enumerate cameras and pick the most likely back camera
          // (some devices reject the facingMode constraint entirely).
          const cameras = await Html5Qrcode.getCameras();
          if (cancelled) return;
          if (!cameras || cameras.length === 0) throw firstErr;
          const back =
            cameras.find((c) => /back|rear|environment/i.test(c.label)) ??
            cameras[cameras.length - 1];
          await scanner.start(back.id, config, onDecode, noop);
        } catch (secondErr) {
          if (cancelled) return;
          setError(friendlyError(secondErr instanceof Error || typeof secondErr === "string" ? secondErr : firstErr));
        }
      }
    });

    return () => {
      cancelled = true;
      safeStop(scannerRef.current);
      scannerRef.current = null;
    };
  }, [open, onClose, router, attempt, onDecodeProp]);

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
            <div className="py-8 flex flex-col items-center text-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-gray-600 max-w-xs">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
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
