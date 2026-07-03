"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, ChevronRight, Banknote, Search } from "lucide-react";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/lib/use-pagination";
import { formatINR } from "@/lib/utils";
import type { AgentWithStats } from "@/actions/admin-agents";

export default function AgentsList({ agents }: { agents: AgentWithStats[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? agents.filter((a) => a.name.toLowerCase().includes(q) || a.referral_code.toLowerCase().includes(q))
    : agents;
  const { page, totalPages, pageItems, setPage, totalItems, pageSize } = usePagination(filtered);

  if (agents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <Users className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No agents yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agent name or referral code…"
          className="pl-9 h-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No agents match &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="grid gap-3">
          {pageItems.map((agent) => (
            <Link key={agent.id} href={`/admin/agents/${agent.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                        {agent.name}
                        {agent.withdrawal_requested_at && (
                          <Banknote className="w-3.5 h-3.5 text-blue-500 shrink-0" aria-label="Withdrawal requested" />
                        )}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">{agent.referral_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatINR(agent.total_commission_earned)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        {agent.pending_commission_count > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            {agent.pending_commission_count} pending
                          </Badge>
                        )}
                        {agent.withdrawal_requested_at && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            Withdrawal requested
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
    </div>
  );
}
