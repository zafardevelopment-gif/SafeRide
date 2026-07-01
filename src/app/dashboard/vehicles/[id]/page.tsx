import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car, Pencil, QrCode } from "lucide-react";
import { getVehicle } from "@/actions/vehicle";
import { getEmergencyContacts } from "@/actions/emergency-contact";
import { getMedicalProfile } from "@/actions/medical-profile";
import { getScansForVehicle } from "@/actions/scan";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmergencyContactsPanel from "@/components/vehicles/emergency-contacts-panel";
import MedicalProfilePanel from "@/components/vehicles/medical-profile-panel";
import ScanHistoryPanel from "@/components/vehicles/scan-history-panel";
import ReportLostButton from "@/components/vehicles/report-lost-button";

export const metadata = { title: "Vehicle Details" };

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

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const [contacts, medicalProfile, scans] = await Promise.all([
    getEmergencyContacts(id),
    getMedicalProfile(id),
    getScansForVehicle(id),
  ]);

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to vehicles
      </Link>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Car className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{vehicle.vehicle_number}</h1>
                <p className="text-sm text-gray-500">
                  {vehicleTypeLabels[vehicle.type]} · {vehicle.brand} {vehicle.model} · {vehicle.color}
                  {vehicle.year ? ` · ${vehicle.year}` : ""}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/vehicles/${id}/edit`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-gray-400" />
              {vehicle.qr_code ? (
                <Badge variant="outline" className={qrStatusStyles[vehicle.qr_code.status] ?? ""}>
                  QR {vehicle.qr_code.status}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                  No QR sticker linked
                </Badge>
              )}
            </div>
            {vehicle.qr_code && vehicle.qr_code.status === "active" && (
              <ReportLostButton vehicleId={id} />
            )}
          </div>
        </CardContent>
      </Card>

      <EmergencyContactsPanel vehicleId={id} initialContacts={contacts} />
      <MedicalProfilePanel vehicleId={id} initialProfile={medicalProfile} />
      <ScanHistoryPanel initialScans={scans} />
    </div>
  );
}
