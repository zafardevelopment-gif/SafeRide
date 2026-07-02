"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, UserCog, Link2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SubmitButton from "@/components/shared/submit-button";
import { updateUserRole, toggleUserActive, deleteUser, permanentlyDeleteUser } from "@/actions/admin-users";
import type { User, UserRole } from "@/types";

const roles: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "agent", label: "Agent" },
  { value: "admin", label: "Admin" },
  { value: "support", label: "Support" },
];

export default function UserDetailPanel({ user }: { user: User & { agent_id: string | null } }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(user.role);
  const [savingRole, setSavingRole] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState(false);
  const isDeleted = !!user.deleted_at;

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    setSavingRole(true);
    const result = await updateUserRole(user.id, role);
    setSavingRole(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update role");
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function handleToggleActive() {
    setTogglingActive(true);
    const result = await toggleUserActive(user.id, !user.is_active);
    setTogglingActive(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update status");
      return;
    }
    toast.success(user.is_active ? "User deactivated" : "User reactivated");
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this user? This blocks their login and blanks their name/email/phone permanently. Their vehicles, payments, and other records are kept. This can't be undone."
      )
    )
      return;
    setDeleting(true);
    const result = await deleteUser(user.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete user");
      return;
    }
    toast.success("User deleted");
    router.refresh();
  }

  async function handlePermanentlyDelete() {
    if (!confirm(`Permanently delete ${user.name ?? "this user"}? This erases the account and all their vehicles/QR data forever — it cannot be undone.`))
      return;
    if (!confirm("Are you absolutely sure? Type-to-confirm isn't required, but there's no recovering from this.")) return;
    setPermanentlyDeleting(true);
    const result = await permanentlyDeleteUser(user.id);
    setPermanentlyDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to permanently delete user");
      return;
    }
    toast.success("User permanently deleted");
    router.push("/admin/users");
  }

  return (
    <div className="space-y-4">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to users
      </Link>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name ?? "—"}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <Badge variant="outline" className={isDeleted ? "bg-gray-100 text-gray-500 border-gray-200" : user.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
              {isDeleted ? "Deleted" : user.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4">
            {!isDeleted && (
              <>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={togglingActive}
                  className={`text-sm font-medium disabled:opacity-50 ${
                    user.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                  }`}
                >
                  {user.is_active ? "Deactivate user" : "Reactivate user"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete user
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handlePermanentlyDelete}
              disabled={permanentlyDeleting}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-800 hover:text-red-900 disabled:opacity-50"
              title="Erases the account and all related data forever"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Permanently delete
            </button>
          </div>

          {user.agent_id && (
            <div className="mt-3">
              <Link
                href={`/admin/agents/${user.agent_id}`}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
              >
                <Link2 className="w-3.5 h-3.5" />
                View agent profile
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <UserCog className="w-4 h-4 text-gray-400" />
            Role
          </h2>
          <form onSubmit={handleSaveRole} className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1 max-w-[200px]">
              <Label htmlFor="role">Assign role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton loading={savingRole} disabled={role === user.role}>
              Save
            </SubmitButton>
          </form>
          {role === "agent" && !user.agent_id && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
              This user has no agent profile (referral code, bank details). Changing their role to
              agent here does not create one — agent profiles are normally created at signup.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
