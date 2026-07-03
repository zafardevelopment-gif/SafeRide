"use client";

import { useState } from "react";
import Link from "next/link";
import { Users as UsersIcon, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/lib/use-pagination";
import type { User, UserRole } from "@/types";

const roleStyles: Record<string, string> = {
  customer: "bg-blue-50 text-blue-700 border-blue-200",
  agent: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-gray-900 text-white border-gray-900",
  support: "bg-amber-50 text-amber-700 border-amber-200",
};

const filters: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customers" },
  { value: "agent", label: "Agents" },
  { value: "admin", label: "Admins" },
  { value: "support", label: "Support" },
];

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const filtered = filter === "all" ? initialUsers : initialUsers.filter((u) => u.role === filter);
  const { page, totalPages, pageItems, setPage, totalItems, pageSize } = usePagination(filtered);

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
            <UsersIcon className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pageItems.map((u) => (
            <Link key={u.id} href={`/admin/users/${u.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{u.name ?? "—"}</p>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!u.is_active && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                        Inactive
                      </Badge>
                    )}
                    <Badge variant="outline" className={roleStyles[u.role] ?? ""}>
                      {u.role}
                    </Badge>
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
