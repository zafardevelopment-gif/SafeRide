import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  QrCode,
  Wallet,
  ShieldAlert,
  Handshake,
  Car,
  Banknote,
  ArrowRight,
  Megaphone,
  MapPin,
} from "lucide-react";

export const metadata = { title: "Admin Dashboard" };

async function getAdminStats() {
  const supabase = await createClient();

  const [
    usersRes,
    qrCodesRes,
    activeQrCodesRes,
    pendingCommissionsRes,
    openScansRes,
    agentsRes,
    vehiclesRes,
    withdrawalRequestsRes,
  ] = await Promise.all([
    supabase.from("ss_users").select("id", { count: "exact", head: true }),
    supabase.from("ss_qr_codes").select("id", { count: "exact", head: true }),
    supabase.from("ss_qr_codes").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("ss_commissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("ss_scans")
      .select("id", { count: "exact", head: true })
      .eq("action_type", "emergency")
      .eq("is_resolved", false),
    supabase.from("ss_agents").select("id", { count: "exact", head: true }),
    supabase.from("ss_vehicles").select("id", { count: "exact", head: true }),
    supabase.from("ss_agents").select("id", { count: "exact", head: true }).not("withdrawal_requested_at", "is", null),
  ]);

  return {
    userCount: usersRes.count ?? 0,
    qrCodeCount: qrCodesRes.count ?? 0,
    activeQrCodeCount: activeQrCodesRes.count ?? 0,
    pendingCommissionCount: pendingCommissionsRes.count ?? 0,
    openEmergencyCount: openScansRes.count ?? 0,
    agentCount: agentsRes.count ?? 0,
    vehicleCount: vehiclesRes.count ?? 0,
    withdrawalRequestCount: withdrawalRequestsRes.count ?? 0,
  };
}

interface RecentActivityItem {
  id: string;
  action_type: string;
  qr_id: string;
  created_at: string;
}

async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_scans")
    .select("id, action_type, qr_id, created_at")
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

const activityMeta: Record<string, { emoji: string; label: string; icon: typeof Megaphone }> = {
  notify_owner: { emoji: "💬", label: "Owner notified", icon: Megaphone },
  wrong_parking: { emoji: "🅿️", label: "Wrong parking reported", icon: MapPin },
  emergency: { emoji: "🚨", label: "Emergency alert", icon: ShieldAlert },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [stats, recentActivity] = await Promise.all([getAdminStats(), getRecentActivity()]);
  const firstName = user.name?.split(" ")[0] ?? "Admin";

  const statCards = [
    {
      label: "Total Users",
      emoji: "👥",
      value: stats.userCount,
      icon: <Users className="w-5 h-5" />,
      chip: "bg-blue-50 text-blue-600",
      bar: "from-blue-500 to-cyan-400",
      href: "/admin/users",
    },
    {
      label: "QR Codes",
      emoji: "🔳",
      value: stats.qrCodeCount,
      icon: <QrCode className="w-5 h-5" />,
      chip: "bg-emerald-50 text-emerald-600",
      bar: "from-emerald-500 to-teal-400",
      href: "/admin/qr-batches",
    },
    {
      label: "Pending Commissions",
      emoji: "💰",
      value: stats.pendingCommissionCount,
      icon: <Wallet className="w-5 h-5" />,
      chip: "bg-violet-50 text-violet-600",
      bar: "from-violet-500 to-purple-400",
      href: "/admin/commissions",
    },
    {
      label: "Open Emergencies",
      emoji: "🚨",
      value: stats.openEmergencyCount,
      icon: <ShieldAlert className="w-5 h-5" />,
      chip: "bg-rose-50 text-rose-600",
      bar: "from-rose-500 to-red-400",
      href: "/admin/scans",
    },
    {
      label: "Active Agents",
      emoji: "🤝",
      value: stats.agentCount,
      icon: <Handshake className="w-5 h-5" />,
      chip: "bg-amber-50 text-amber-600",
      bar: "from-amber-500 to-orange-400",
      href: "/admin/agents",
    },
    {
      label: "Active Stickers",
      emoji: "✅",
      value: stats.activeQrCodeCount,
      icon: <QrCode className="w-5 h-5" />,
      chip: "bg-teal-50 text-teal-600",
      bar: "from-teal-500 to-cyan-400",
      href: "/admin/qr-batches",
    },
    {
      label: "Total Vehicles",
      emoji: "🚗",
      value: stats.vehicleCount,
      icon: <Car className="w-5 h-5" />,
      chip: "bg-indigo-50 text-indigo-600",
      bar: "from-indigo-500 to-blue-400",
      href: "/admin/users",
    },
    {
      label: "Withdrawal Requests",
      emoji: "🏦",
      value: stats.withdrawalRequestCount,
      icon: <Banknote className="w-5 h-5" />,
      chip: "bg-fuchsia-50 text-fuchsia-600",
      bar: "from-fuchsia-500 to-pink-400",
      href: "/admin/agents",
    },
  ];

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
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="relative overflow-hidden border-slate-200/80 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-slate-900/5">
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
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 transition-colors group-hover:text-blue-500 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-slate-200/80">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">Recent Activity</h2>
            <Link
              href="/admin/scans"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:underline"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">No scans yet.</p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((item) => {
                const meta = activityMeta[item.action_type] ?? activityMeta.notify_owner;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 -mx-2 hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-base">
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{meta.label}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        SRQ-{item.qr_id} · {timeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
