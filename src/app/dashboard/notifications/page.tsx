import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, MapPin, ChevronRight } from "lucide-react";
import { getRecentScansForUser } from "@/actions/scan";
import MapPreview from "@/components/shared/map-preview";
import type { ScanActionType } from "@/types";

export const metadata = { title: "Notifications" };

const actionMeta: Record<
  ScanActionType,
  { emoji: string; title: string; chip: string }
> = {
  notify_owner: { emoji: "💬", title: "Someone left you a message", chip: "bg-blue-50 text-blue-700 border-blue-100" },
  wrong_parking: { emoji: "🅿️", title: "Wrong parking reported", chip: "bg-amber-50 text-amber-700 border-amber-100" },
  emergency: { emoji: "🚨", title: "Emergency alert", chip: "bg-red-50 text-red-700 border-red-100" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function NotificationsPage() {
  const notifications = await getRecentScansForUser();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Bell className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            Every scan alert from your vehicles 🔔
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <span className="text-4xl" aria-hidden>🔕</span>
            <p className="font-semibold text-slate-700">No notifications yet</p>
            <p className="text-sm text-slate-400 max-w-xs">
              When someone scans your QR sticker and sends an alert, it will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(({ scan, vehicleNumber }) => {
            const meta = actionMeta[scan.action_type] ?? actionMeta.notify_owner;
            return (
              <Card key={scan.id} className="border-slate-200/80 hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl">
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-slate-900">{meta.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>
                          {vehicleNumber || "Unknown vehicle"}
                        </span>
                        {scan.action_type === "emergency" && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            scan.is_resolved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-600 text-white border-red-600"
                          }`}>
                            {scan.is_resolved ? "✓ Resolved" : "● Open"}
                          </span>
                        )}
                      </div>
                      {scan.scanner_message && (
                        <p className="mt-1 text-sm text-slate-600 break-words">
                          &ldquo;{scan.scanner_message}&rdquo;
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>{timeAgo(scan.created_at)}</span>
                        {scan.location_lat != null && scan.location_lng != null && (
                          <a
                            href={`https://www.google.com/maps?q=${scan.location_lat},${scan.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <MapPin className="w-3 h-3" />
                            View location
                          </a>
                        )}
                      </div>
                      {scan.location_lat != null && scan.location_lng != null && (
                        <div className="mt-2">
                          <MapPreview lat={scan.location_lat} lng={scan.location_lng} />
                        </div>
                      )}
                      {scan.photo_url && (
                        <div className="mt-2 relative w-full max-w-xs h-40 rounded-lg overflow-hidden border border-slate-200">
                          <Image
                            src={scan.photo_url}
                            alt="Report photo"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/vehicles"
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
      >
        Manage vehicles <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
