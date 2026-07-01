import Link from "next/link";
import { getVehicles } from "@/actions/vehicle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Plus, QrCode } from "lucide-react";

export const metadata = { title: "My Vehicles" };

const vehicleTypeLabels: Record<string, string> = {
  bike: "Bike",
  scooter: "Scooter",
  car: "Car",
  auto: "Auto",
  truck: "Truck",
  other: "Other",
};

const qrStatusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  unactivated: "bg-gray-50 text-gray-600 border-gray-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default async function VehiclesPage() {
  const vehicles = await getVehicles();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Vehicles</h1>
        <Link
          href="/dashboard/vehicles/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Car className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No vehicles yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Add your vehicle to activate a QR sticker and start protecting it.
            </p>
            <Link
              href="/dashboard/vehicles/new"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first vehicle
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/dashboard/vehicles/${vehicle.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{vehicle.vehicle_number}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {vehicleTypeLabels[vehicle.type]} · {vehicle.brand} {vehicle.model} · {vehicle.color}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {vehicle.qr_code ? (
                      <Badge
                        variant="outline"
                        className={qrStatusStyles[vehicle.qr_code.status] ?? ""}
                      >
                        <QrCode className="w-3 h-3" />
                        {vehicle.qr_code.status}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        No QR linked
                      </Badge>
                    )}
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
