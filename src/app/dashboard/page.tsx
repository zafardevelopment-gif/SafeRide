import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Car, QrCode, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import QuickActions from "@/components/dashboard/quick-actions";

export const metadata = { title: "Dashboard" };

async function getDashboardStats(userId: string) {
  const supabase = await createClient();

  const [vehiclesRes, stickersRes, contactsRes] = await Promise.all([
    supabase.from("ss_vehicles").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("is_active", true),
    supabase.from("ss_qr_codes").select("id, status", { count: "exact" }).in(
      "vehicle_id",
      (await supabase.from("ss_vehicles").select("id").eq("owner_id", userId)).data?.map((v) => v.id) ?? []
    ),
    supabase.from("ss_emergency_contacts").select("id", { count: "exact", head: true }).in(
      "vehicle_id",
      (await supabase.from("ss_vehicles").select("id").eq("owner_id", userId)).data?.map((v) => v.id) ?? []
    ),
  ]);

  return {
    vehicleCount: vehiclesRes.count ?? 0,
    activeStickers: stickersRes.data?.filter((q) => q.status === "active").length ?? 0,
    contactCount: contactsRes.count ?? 0,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getDashboardStats(user.id);
  const firstName = user.name?.split(" ")[0] ?? "there";
  const isEmpty = stats.vehicleCount === 0;

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
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {isEmpty
                ? "Let's get your first vehicle protected 🚀"
                : `You have ${stats.vehicleCount} vehicle${stats.vehicleCount > 1 ? "s" : ""} protected 🛡️`}
            </p>
          </div>
          <span className="hidden sm:flex size-12 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur">
            {isEmpty ? "🚀" : "🛡️"}
          </span>
        </div>
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <Card className="border-dashed border-blue-200 bg-gradient-to-b from-blue-50/80 to-white">
          <CardContent className="py-10 flex flex-col items-center text-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Add your first vehicle
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Link your vehicle to a QR sticker so people can alert you when they scan it.
              </p>
            </div>
            <Link
              href="/dashboard/vehicles"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-colors"
            >
              Add Vehicle <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Vehicles",
            value: stats.vehicleCount,
            icon: <Car className="w-5 h-5" />,
            href: "/dashboard/vehicles",
            chip: "bg-blue-50 text-blue-600",
          },
          {
            label: "Active QR Stickers",
            value: stats.activeStickers,
            icon: <QrCode className="w-5 h-5" />,
            href: "/dashboard/stickers",
            chip: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Emergency Contacts",
            value: stats.contactCount,
            icon: <Phone className="w-5 h-5" />,
            href: "/dashboard/emergency-contacts",
            chip: "bg-amber-50 text-amber-600",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="border-slate-200/80 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-slate-900/5">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <span className={`flex size-10 items-center justify-center rounded-xl ${stat.chip}`}>
                    {stat.icon}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 transition-colors group-hover:text-blue-500" />
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-500">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <QuickActions />
    </div>
  );
}
