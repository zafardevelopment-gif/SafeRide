"use client";

import { useState } from "react";
import { ShieldAlert, Megaphone, MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScanWithFlag } from "@/actions/admin-scans";
import type { ScanActionType } from "@/types";

const actionMeta: Record<string, { label: string; icon: typeof Megaphone; color: string }> = {
  notify_owner: { label: "Notify Owner", icon: Megaphone, color: "text-blue-500" },
  wrong_parking: { label: "Wrong Parking", icon: MapPin, color: "text-amber-500" },
  emergency: { label: "Emergency", icon: ShieldAlert, color: "text-red-500" },
};

const filters: { value: ScanActionType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "notify_owner", label: "Notify Owner" },
  { value: "wrong_parking", label: "Wrong Parking" },
  { value: "emergency", label: "Emergency" },
];

const REPEAT_THRESHOLD = 3;

export default function ScansTable({ initialScans }: { initialScans: ScanWithFlag[] }) {
  const [filter, setFilter] = useState<ScanActionType | "all">("all");
  const filtered = filter === "all" ? initialScans : initialScans.filter((s) => s.action_type === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border border-border p-1 bg-white w-fit">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === f.value ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <ShieldAlert className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No scans</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((scan) => {
            const meta = actionMeta[scan.action_type];
            const Icon = meta.icon;
            const flagged = scan.same_ip_count > REPEAT_THRESHOLD;
            return (
              <Card key={scan.id} className={flagged ? "border-red-200" : undefined}>
                <CardContent className="py-3 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${meta.color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {meta.label} <span className="text-gray-400 font-mono text-xs">{scan.qr_id}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {scan.ip_address ?? "unknown IP"} · {new Date(scan.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {scan.is_resolved && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                        Resolved
                      </Badge>
                    )}
                    {flagged && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {scan.same_ip_count} from this IP
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
