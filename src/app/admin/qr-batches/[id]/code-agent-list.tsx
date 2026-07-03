"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Loader2, Search, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/lib/use-pagination";
import { assignQRCodeAgent, getQRCodeOwnerDetailsBatch } from "@/actions/qr-batch";
import AdminActivateModal from "../admin-activate-modal";
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
  const router = useRouter();
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(codes.map((c) => [c.id, c.agent_id]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, QRCodeOwnerDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [query, setQuery] = useState("");
  const [activatingQrId, setActivatingQrId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? codes.filter((c) => c.qr_id.toLowerCase().includes(q)) : codes;
  const { page, totalPages, pageItems, setPage, totalItems, pageSize } = usePagination(filtered);

  // Fetch owner/vehicle summaries for the active codes on the current page
  // only — avoids an N+1 lookup and keeps this fast even for large batches.
  useEffect(() => {
    const activeIds = pageItems.filter((c) => c.status === "active").map((c) => c.id);
    const missingIds = activeIds.filter((id) => !(id in details));
    if (missingIds.length === 0) return;

    setLoadingDetails(true);
    getQRCodeOwnerDetailsBatch(missingIds)
      .then((result) => {
        setDetails((prev) => ({ ...prev, ...result }));
      })
      .catch((err) => {
        console.error("[CodeAgentList] getQRCodeOwnerDetailsBatch failed:", err);
      })
      .finally(() => {
        setLoadingDetails(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageItems]);

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

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search QR code…"
            className="pl-9 h-9"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-border">
                <th className="font-medium py-2 pr-3">QR code</th>
                <th className="font-medium py-2 pr-3">Status</th>
                <th className="font-medium py-2 pr-3">Vehicle / owner</th>
                <th className="font-medium py-2 pr-3">Agent</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((code) => {
                const editable = code.status === "unactivated";
                const detail = details[code.id];
                return (
                  <tr key={code.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 font-mono text-gray-700 whitespace-nowrap">{code.qr_id}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className={statusStyles[code.status] ?? ""}>
                        {code.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 min-w-[200px]">
                      {code.status === "active" ? (
                        loadingDetails && !detail ? (
                          <span className="inline-flex items-center gap-1.5 text-gray-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                          </span>
                        ) : detail?.vehicle ? (
                          <div>
                            <p className="text-gray-900 font-semibold">
                              {detail.vehicle.brand} {detail.vehicle.model} ({detail.vehicle.vehicle_number})
                            </p>
                            <p className="text-gray-500">
                              {detail.owner?.name ?? "Unnamed"}
                              {detail.owner?.phone ? ` · ${detail.owner.phone}` : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No vehicle linked.</span>
                        )
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {editable ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={assignments[code.id] ?? ""}
                            onChange={(e) => handleChange(code.id, e.target.value)}
                            disabled={savingId === code.id}
                            className="h-8 rounded-lg border border-border bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50"
                          >
                            <option value="">No agent</option>
                            {agents.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.referral_code})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setActivatingQrId(code.qr_id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 h-8 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
                          >
                            <Car className="w-3.5 h-3.5" />
                            Activate
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          {agents.find((a) => a.id === assignments[code.id])?.name ?? "No agent"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </CardContent>

      {activatingQrId && (
        <AdminActivateModal
          qrId={activatingQrId}
          onClose={() => setActivatingQrId(null)}
          onActivated={() => {
            setActivatingQrId(null);
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}
