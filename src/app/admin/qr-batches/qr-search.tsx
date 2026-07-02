"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, User, Car, Handshake, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  searchQRCodes,
  changeQRCodeStatus,
  type QRCodeSearchResult,
} from "@/actions/qr-batch";

const statusStyles: Record<string, string> = {
  unactivated: "bg-gray-50 text-gray-600 border-gray-200",
  active: "bg-green-50 text-green-700 border-green-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default function QrSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState<string | null>(null);
  const [results, setResults] = useState<QRCodeSearchResult[] | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchQRCodes(query);
    setLoading(false);
    setResults(res);
  }

  async function handleStatusChange(codeId: string, status: "active" | "suspended" | "lost") {
    const labels = { active: "reactivate", suspended: "suspend", lost: "mark as lost" };
    if (!confirm(`Are you sure you want to ${labels[status]} this QR code?`)) return;
    setChanging(codeId + status);
    const result = await changeQRCodeStatus(codeId, status);
    setChanging(null);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update status");
      return;
    }
    toast.success("QR code status updated");
    const res = await searchQRCodes(query);
    setResults(res);
  }

  return (
    <Card className="border-slate-200/80">
      <CardContent className="pt-5 pb-5 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search QR code… e.g. SRQ-DFJMHVMF 🔍"
              className="pl-9"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </form>

        {results !== null && results.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-2">
            😕 No QR code found matching &ldquo;{query}&rdquo;
          </p>
        )}

        {results?.map(({ code, agentName, owner, vehicle }) => {
          const taken = code.status !== "unactivated";
          return (
            <div key={code.id} className="rounded-xl border border-slate-200/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-bold text-slate-900">SRQ-{code.qr_id}</span>
                <Badge variant="outline" className={statusStyles[code.status] ?? ""}>
                  {code.status}
                </Badge>
              </div>

              {taken ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <User className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-slate-900">{owner?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500 break-all">{owner?.email ?? ""}</p>
                      {owner?.phone && <p className="text-xs text-slate-500">📞 {owner.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <Car className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-slate-900">{vehicle?.vehicle_number ?? "—"}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {vehicle ? `${vehicle.type} · ${vehicle.brand} ${vehicle.model} · ${vehicle.color}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  🏷️ Blank sticker — not activated by anyone yet.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                {agentName && (
                  <span className="inline-flex items-center gap-1">
                    <Handshake className="w-3.5 h-3.5" /> Agent: {agentName}
                  </span>
                )}
                {code.activated_at && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Activated: {new Date(code.activated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>

              {taken && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] text-slate-400 mb-2">
                    🔒 Activated codes can&apos;t be deleted. If there&apos;s an issue, change the
                    status below — replacement sticker may incur an extra charge.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {code.status !== "active" && (
                      <button
                        type="button"
                        disabled={changing === code.id + "active"}
                        onClick={() => handleStatusChange(code.id, "active")}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        ✅ Reactivate
                      </button>
                    )}
                    {code.status !== "suspended" && (
                      <button
                        type="button"
                        disabled={changing === code.id + "suspended"}
                        onClick={() => handleStatusChange(code.id, "suspended")}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        ⏸️ Suspend
                      </button>
                    )}
                    {code.status !== "lost" && (
                      <button
                        type="button"
                        disabled={changing === code.id + "lost"}
                        onClick={() => handleStatusChange(code.id, "lost")}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        🚫 Mark Lost
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
