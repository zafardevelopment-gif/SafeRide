"use client";

import { useState } from "react";
import { toast } from "sonner";
import { History, Megaphone, MapPin, ShieldAlert, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resolveScan } from "@/actions/scan";
import type { Scan } from "@/types";

interface ScanHistoryPanelProps {
  initialScans: Scan[];
}

const actionMeta: Record<string, { label: string; icon: typeof Megaphone; color: string }> = {
  notify_owner: { label: "Notify Owner", icon: Megaphone, color: "text-blue-500" },
  wrong_parking: { label: "Wrong Parking", icon: MapPin, color: "text-amber-500" },
  emergency: { label: "Emergency", icon: ShieldAlert, color: "text-red-500" },
};

export default function ScanHistoryPanel({ initialScans }: ScanHistoryPanelProps) {
  const [scans, setScans] = useState(initialScans);

  async function handleResolve(id: string) {
    const result = await resolveScan(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to mark resolved");
      return;
    }
    setScans((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_resolved: true, resolved_at: new Date().toISOString() } : s))
    );
    toast.success("Marked as resolved");
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-gray-400" />
          Scan Activity
        </h2>

        {scans.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No scans yet.</p>
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => {
              const meta = actionMeta[scan.action_type];
              const Icon = meta.icon;
              return (
                <div key={scan.id} className="rounded-lg border border-border px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${meta.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                          {scan.is_resolved && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        {scan.scanner_message && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{scan.scanner_message}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(scan.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    {scan.action_type === "wrong_parking" && !scan.is_resolved && (
                      <button
                        type="button"
                        onClick={() => handleResolve(scan.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
