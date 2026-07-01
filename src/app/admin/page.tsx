import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Users, QrCode, Wallet, ShieldAlert } from "lucide-react";

export const metadata = { title: "Admin Dashboard" };

async function getAdminStats() {
  const supabase = await createClient();

  const [usersRes, qrCodesRes, pendingCommissionsRes, openScansRes] = await Promise.all([
    supabase.from("ss_users").select("id", { count: "exact", head: true }),
    supabase.from("ss_qr_codes").select("id", { count: "exact", head: true }),
    supabase
      .from("ss_commissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("ss_scans")
      .select("id", { count: "exact", head: true })
      .eq("action_type", "emergency")
      .eq("is_resolved", false),
  ]);

  return {
    userCount: usersRes.count ?? 0,
    qrCodeCount: qrCodesRes.count ?? 0,
    pendingCommissionCount: pendingCommissionsRes.count ?? 0,
    openEmergencyCount: openScansRes.count ?? 0,
  };
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getAdminStats();
  const firstName = user.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: stats.userCount,
            icon: <Users className="w-5 h-5 text-blue-500" />,
            color: "bg-blue-50",
          },
          {
            label: "QR Codes",
            value: stats.qrCodeCount,
            icon: <QrCode className="w-5 h-5 text-green-500" />,
            color: "bg-green-50",
          },
          {
            label: "Pending Commissions",
            value: stats.pendingCommissionCount,
            icon: <Wallet className="w-5 h-5 text-purple-500" />,
            color: "bg-purple-50",
          },
          {
            label: "Open Emergencies",
            value: stats.openEmergencyCount,
            icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
            color: "bg-red-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className={`border-0 ${stat.color}`}>
            <CardContent className="pt-4 pb-3">
              <div className="mb-2">{stat.icon}</div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
