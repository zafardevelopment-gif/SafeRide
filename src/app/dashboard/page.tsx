import { getCurrentUser } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isEmpty
            ? "Let's get your first vehicle protected."
            : `You have ${stats.vehicleCount} vehicle${stats.vehicleCount > 1 ? "s" : ""} protected.`}
        </p>
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-8 flex flex-col items-center text-center gap-4">
            <ShieldCheck className="w-12 h-12 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add your first vehicle
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Link your vehicle to a QR sticker so people can alert you when they scan it.
              </p>
            </div>
            <Link
              href="/dashboard/vehicles"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
            icon: <Car className="w-5 h-5 text-blue-500" />,
            href: "/dashboard/vehicles",
            color: "bg-blue-50",
          },
          {
            label: "Active QR Stickers",
            value: stats.activeStickers,
            icon: <QrCode className="w-5 h-5 text-green-500" />,
            href: "/dashboard/stickers",
            color: "bg-green-50",
          },
          {
            label: "Emergency Contacts",
            value: stats.contactCount,
            icon: <Phone className="w-5 h-5 text-orange-500" />,
            href: "/dashboard/emergency-contacts",
            color: "bg-orange-50",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${stat.color} border-0`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  {stat.icon}
                  <Badge variant="secondary" className="text-xs">
                    {stat.value}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-700">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <QuickActions />
    </div>
  );
}
