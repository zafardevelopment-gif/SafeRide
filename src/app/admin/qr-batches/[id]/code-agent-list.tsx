"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users, ChevronDown, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assignQRCodeAgent, getQRCodeOwnerDetail } from "@/actions/qr-batch";
import type { QRCode } from "@/types";
import type { QRCodeOwnerDetail } from "@/actions/qr-batch";

interface CodeAgentListProps {
  codes: QRCode[];
  agents: { id: string; name: string; referral_code: string }[];
}

const statusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  unactivated: "bg-gray-50 text-gray-600 border-gray-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default function CodeAgentList({ codes, agents }: CodeAgentListProps) {
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(codes.map((c) => [c.id, c.agent_id]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, QRCodeOwnerDetail>>({});

  async function handleToggleExpand(codeId: string) {
    if (expandedId === codeId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(codeId);
    if (!details[codeId]) {
      setLoadingDetailId(codeId);
      const detail = await getQRCodeOwnerDetail(codeId);
      setLoadingDetailId(null);
      if (detail) setDetails((prev) => ({ ...prev, [codeId]: detail }));
    }
  }

  async function handleChange(codeId: string, value: string) {
    const agentId = value || null;
    setSavingId(codeId);
    const result = await assignQRCodeAgent(codeId, agentId);
    setSavingId(null);

    if (!result.success) {
      toast.error(result.error ?? "Failed to assign agent");
      return;
    }
    setAssignments((prev) => ({ ...prev, [codeId]: agentId }));
    toast.success("Agent updated");
  }

  return (
    <Card className="print:hidden">
      <CardContent className="py-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-400" />
          Assign Agents Individually
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Only unactivated codes can be reassigned — activated codes already have a commission tied to their agent.
        </p>

        <div className="space-y-2">
          {codes.map((code) => {
            const editable = code.status === "unactivated";
            const expandable = code.status === "active";
            const isExpanded = expandedId === code.id;
            const detail = details[code.id];
            return (
              <div key={code.id} className="rounded-lg border border-border overflow-hidden">
                <div
                  className={`flex items-center justify-between gap-3 px-3 py-2 ${
                    expandable ? "cursor-pointer hover:bg-gray-50" : ""
                  }`}
                  onClick={expandable ? () => handleToggleExpand(code.id) : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-gray-700 shrink-0">{code.qr_id}</span>
                    <Badge variant="outline" className={statusStyles[code.status] ?? ""}>
                      {code.status}
                    </Badge>
                    {expandable && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                  {editable ? (
                    <select
                      value={assignments[code.id] ?? ""}
                      onChange={(e) => handleChange(code.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={savingId === code.id}
                      className="h-8 rounded-lg border border-border bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50 shrink-0"
                    >
                      <option value="">No agent</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.referral_code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">
                      {agents.find((a) => a.id === assignments[code.id])?.name ?? "No agent"}
                    </span>
                  )}
                </div>

                {expandable && isExpanded && (
                  <div className="border-t border-border bg-gray-50 px-3 py-2.5 text-xs">
                    {loadingDetailId === code.id ? (
                      <span className="inline-flex items-center gap-1.5 text-gray-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                      </span>
                    ) : detail?.vehicle ? (
                      <div className="space-y-1">
                        <p className="text-gray-900 font-semibold">
                          {detail.vehicle.brand} {detail.vehicle.model} ({detail.vehicle.vehicle_number})
                        </p>
                        <p className="text-gray-500">
                          Owner: {detail.owner?.name ?? "Unnamed"}
                          {detail.owner?.phone ? ` · ${detail.owner.phone}` : ""}
                          {detail.owner?.email ? ` · ${detail.owner.email}` : ""}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">No vehicle linked.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
