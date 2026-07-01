import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, ChevronRight } from "lucide-react";
import { getVehicles } from "@/actions/vehicle";
import ScanQrButton from "@/components/shared/scan-qr-button";

export const metadata = { title: "My QR Stickers" };

const qrStatusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  unactivated: "bg-gray-50 text-gray-600 border-gray-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default async function StickersPage() {
  const vehicles = await getVehicles();
  const linked = vehicles.filter((v) => v.qr_code);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">My QR Stickers</h1>
        <ScanQrButton>Scan New Sticker</ScanQrButton>
      </div>

      {linked.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <QrCode className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No QR stickers linked yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Scan a sticker and activate it from the sticker's page to link it to a vehicle.
            </p>
            <ScanQrButton className="mt-2 bg-primary text-primary-foreground hover:bg-primary/80 border-0">
              Scan QR to Activate
            </ScanQrButton>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {linked.map((vehicle) => (
            <Link key={vehicle.id} href={`/dashboard/vehicles/${vehicle.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{vehicle.vehicle_number}</p>
                      <p className="text-xs text-gray-500 font-mono">{vehicle.qr_code!.qr_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={qrStatusStyles[vehicle.qr_code!.status] ?? ""}>
                      {vehicle.qr_code!.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
