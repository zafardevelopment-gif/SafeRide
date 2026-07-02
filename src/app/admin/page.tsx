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
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_80%_0%,theme(colors.blue.600/.35),transparent)]"
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Here&apos;s what&apos;s happening on your platform today 📊
            </p>
          </div>
          <span className="hidden sm:flex size-12 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur">
            🛡️
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Users",
            emoji: "👥",
            value: stats.userCount,
            icon: <Users className="w-5 h-5" />,
            chip: "bg-blue-50 text-blue-600",
            bar: "from-blue-500 to-cyan-400",
          },
          {
            label: "QR Codes",
            emoji: "🔳",
            value: stats.qrCodeCount,
            icon: <QrCode className="w-5 h-5" />,
            chip: "bg-emerald-50 text-emerald-600",
            bar: "from-emerald-500 to-teal-400",
          },
          {
            label: "Pending Commissions",
            emoji: "💰",
            value: stats.pendingCommissionCount,
            icon: <Wallet className="w-5 h-5" />,
            chip: "bg-violet-50 text-violet-600",
            bar: "from-violet-500 to-purple-400",
          },
          {
            label: "Open Emergencies",
            emoji: "🚨",
            value: stats.openEmergencyCount,
            icon: <ShieldAlert className="w-5 h-5" />,
            chip: "bg-rose-50 text-rose-600",
            bar: "from-rose-500 to-red-400",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="relative overflow-hidden border-slate-200/80 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
          >
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.bar}`}
            />
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <span className={`flex size-10 items-center justify-center rounded-xl ${stat.chip}`}>
                  {stat.icon}
                </span>
                <span className="text-lg" aria-hidden>{stat.emoji}</span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
