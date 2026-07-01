import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, ShieldAlert, MapPin, Megaphone, ShieldOff, Lightbulb, Truck } from "lucide-react";

export const metadata = { title: "Scan a SafeRide QR" };

async function getQRCode(qrId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ss_qr_codes")
    .select("id, qr_id, status")
    .eq("qr_id", qrId)
    .maybeSingle();
  return data;
}

export default async function ScanPage({ params }: { params: Promise<{ qr_id: string }> }) {
  const { qr_id } = await params;
  const qrCode = await getQRCode(qr_id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-bold text-blue-600 text-lg tracking-tight">SafeRide QR</span>
        </div>

        {!qrCode && (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-center gap-3">
              <ShieldOff className="w-10 h-10 text-gray-300" />
              <p className="font-semibold text-gray-700">Invalid QR code</p>
              <p className="text-sm text-gray-400">
                This sticker code doesn't match any SafeRide QR in our system.
              </p>
            </CardContent>
          </Card>
        )}

        {qrCode?.status === "unactivated" && (
          <Card className="border-blue-200">
            <CardContent className="py-8 flex flex-col items-center text-center gap-3">
              <QrCode className="w-10 h-10 text-blue-400" />
              <p className="font-semibold text-gray-900">This sticker is not active yet</p>
              <p className="text-sm text-gray-500">
                If this is your vehicle, activate the sticker to link it and protect your ride.
              </p>
              <Link
                href={`/scan/${qr_id}/activate`}
                className="mt-2 inline-flex items-center justify-center rounded-lg px-5 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                Are you the owner? Activate now
              </Link>
            </CardContent>
          </Card>
        )}

        {qrCode?.status === "active" && (
          <div className="space-y-3">
            <Card>
              <CardContent className="py-5 text-center">
                <Badge variant="secondary" className="mb-2">Active sticker</Badge>
                <p className="text-sm text-gray-500">
                  This vehicle is protected by SafeRide QR. Choose an option below — the owner's
                  contact details are never shown to you.
                </p>
              </CardContent>
            </Card>

            <Link
              href={`/scan/${qr_id}/notify`}
              className="w-full flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-left hover:bg-blue-50 transition-colors"
            >
              <Megaphone className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Notify Owner</p>
                <p className="text-xs text-gray-500">Send a quick message</p>
              </div>
            </Link>

            <Link
              href={`/scan/${qr_id}/wrong-parking`}
              className="w-full flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-left hover:bg-amber-50 transition-colors"
            >
              <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Wrong Parking</p>
                <p className="text-xs text-gray-500">Report a parking issue</p>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/scan/${qr_id}/wrong-parking?reason=${encodeURIComponent("lights on")}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center hover:bg-gray-100 transition-colors"
              >
                <Lightbulb className="w-5 h-5 text-gray-500" />
                <p className="font-medium text-gray-900 text-xs">Lights On</p>
              </Link>
              <Link
                href={`/scan/${qr_id}/wrong-parking?reason=${encodeURIComponent("towing")}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center hover:bg-gray-100 transition-colors"
              >
                <Truck className="w-5 h-5 text-gray-500" />
                <p className="font-medium text-gray-900 text-xs">Towing</p>
              </Link>
            </div>

            <Link
              href={`/scan/${qr_id}/emergency`}
              className="w-full flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-left hover:bg-red-50 transition-colors"
            >
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Emergency</p>
                <p className="text-xs text-gray-500">Report an accident</p>
              </div>
            </Link>
          </div>
        )}

        {(qrCode?.status === "suspended" || qrCode?.status === "lost") && (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-center gap-3">
              <ShieldOff className="w-10 h-10 text-gray-300" />
              <p className="font-semibold text-gray-700">This sticker is inactive</p>
              <p className="text-sm text-gray-400">
                This QR sticker has been {qrCode.status === "lost" ? "reported lost" : "suspended"} by its owner
                and is no longer in use.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
