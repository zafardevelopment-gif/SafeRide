import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, ChevronRight } from "lucide-react";
import { getVehicles } from "@/actions/vehicle";
import { getEmergencyContacts } from "@/actions/emergency-contact";

export const metadata = { title: "Emergency Contacts" };

export default async function EmergencyContactsPage() {
  const vehicles = await getVehicles();
  const contactsByVehicle = await Promise.all(
    vehicles.map(async (v) => ({ vehicle: v, contacts: await getEmergencyContacts(v.id) }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Emergency Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">Managed per vehicle.</p>
      </div>

      {vehicles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Phone className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No vehicles yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Add a vehicle first, then add emergency contacts for it.
            </p>
            <Link
              href="/dashboard/vehicles/new"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              Add a vehicle
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {contactsByVehicle.map(({ vehicle, contacts }) => (
            <Link key={vehicle.id} href={`/dashboard/vehicles/${vehicle.id}`}>
              <Card className="hover:border-blue-200 transition-colors">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{vehicle.vehicle_number}</p>
                    <p className="text-sm text-gray-500">
                      {contacts.length === 0
                        ? "No contacts added"
                        : `${contacts.length} contact${contacts.length > 1 ? "s" : ""}: ${contacts
                            .map((c) => c.name)
                            .join(", ")}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
