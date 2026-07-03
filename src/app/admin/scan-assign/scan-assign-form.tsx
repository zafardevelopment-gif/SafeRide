"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QrCode, CheckCircle2, XCircle, AlertCircle, RefreshCw, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AgentCombobox from "@/components/shared/agent-combobox";
import { assignQRCodeAgentByQrId } from "@/actions/qr-batch";

interface ScanAssignFormProps {
  agents: { id: string; name: string; referral_code: string }[];
}

const SCANNER_ELEMENT_ID = "ss-scan-assign-region";
const RESCAN_COOLDOWN_MS = 2000;

interface ScanLogEntry {
  qrId: string;
  ok: boolean;
  message: string;
}

// Html5Qrcode.stop() throws synchronously if the scanner isn't currently
// running (e.g. cleanup runs twice under React StrictMode in dev).
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

function friendlyError(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const text = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();

  if (name === "NotAllowedError" || text.includes("permission") || text.includes("denied")) {
    return "Camera permission is blocked. Tap the lock icon 🔒 in your address bar → Permissions → allow Camera, then try again.";
  }
  if (name === "NotReadableError" || text.includes("in use") || text.includes("could not start")) {
    return "Camera is busy — another app may be using it.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || text.includes("no camera") || text.includes("not found")) {
    return "No usable camera was found on this device.";
  }
  return "Couldn't access the camera. Please check camera permission for this site.";
}

export default function ScanAssignForm({ agents }: ScanAssignFormProps) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [log, setLog] = useState<ScanLogEntry[]>([]);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const agentIdRef = useRef(agentId);
  const busyRef = useRef(false);
  const lastScanRef = useRef<{ qrId: string; at: number } | null>(null);

  useEffect(() => {
    agentIdRef.current = agentId;
  }, [agentId]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;
    setError(null);

    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 240, height: 240 } };
      const onDecode = async (decodedText: string) => {
        const qrId = extractQrId(decodedText);
        const now = Date.now();
        if (busyRef.current) return;
        if (lastScanRef.current?.qrId === qrId && now - lastScanRef.current.at < RESCAN_COOLDOWN_MS) {
          return; // same sticker still in frame — avoid double-assigning
        }
        if (!agentIdRef.current) {
          toast.error("Pick an agent first.");
          return;
        }

        busyRef.current = true;
        lastScanRef.current = { qrId, at: now };
        const result = await assignQRCodeAgentByQrId(qrId, agentIdRef.current);
        busyRef.current = false;

        setLog((prev) => [
          { qrId, ok: result.success, message: result.success ? "Assigned" : result.error ?? "Failed" },
          ...prev,
        ]);
        if (result.success) {
          toast.success(`SRQ-${qrId} assigned`);
        } else {
          toast.error(result.error ?? "Failed to assign");
        }
      };
      const noop = () => {
        // Per-frame "no QR found" callback — expected, not an error.
      };

      try {
        await scanner.start({ facingMode: "environment" }, config, onDecode, noop);
      } catch (firstErr) {
        if (cancelled) return;
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cancelled) return;
          if (!cameras || cameras.length === 0) throw firstErr;
          const back =
            cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1];
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
  }, [scanning, attempt]);

  const assignedCount = log.filter((l) => l.ok).length;

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-blue-500" />
          Scan &amp; Assign to Agent
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pick an agent, then scan each printed sticker one by one — every scan assigns that sticker
          to the selected agent.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Agent</Label>
            <AgentCombobox agents={agents} value={agentId} onChange={setAgentId} disabled={scanning} />
          </div>

          {!scanning ? (
            <button
              type="button"
              onClick={() => setScanning(true)}
              disabled={!agentId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              Start scanning
            </button>
          ) : (
            <>
              {error ? (
                <div className="py-6 flex flex-col items-center text-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <p className="text-sm text-gray-600 max-w-xs">{error}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </button>
                </div>
              ) : (
                <div id={SCANNER_ELEMENT_ID} className="w-full rounded-lg overflow-hidden bg-black" />
              )}
              <button
                type="button"
                onClick={() => setScanning(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 h-9 text-sm font-medium border border-border bg-white hover:bg-gray-50 transition-colors"
              >
                Stop scanning
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {log.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Scanned this session
              </h2>
              <span className="text-xs text-gray-400">{assignedCount} assigned</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {log.map((entry, i) => (
                <div
                  key={`${entry.qrId}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {entry.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <span className="font-mono text-xs text-gray-700 shrink-0">SRQ-{entry.qrId}</span>
                  <span className="text-xs text-gray-400 truncate">{entry.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
