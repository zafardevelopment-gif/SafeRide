"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Phone, ArrowLeft, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { claimPlaceholderVehicle } from "@/actions/claim-vehicle";
import type { VehicleType } from "@/types";

type Step = "vehicle" | "contact";

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "car", label: "Car" },
  { value: "auto", label: "Auto" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
];

export default function ClaimForm({ qrId }: { qrId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("vehicle");
  const [loading, setLoading] = useState(false);

  const [ownerPhone, setOwnerPhone] = useState("");
  const [vehicle, setVehicle] = useState({
    vehicle_number: "",
    type: "bike" as VehicleType,
    brand: "",
    model: "",
    color: "",
    year: "",
  });
  const [contact, setContact] = useState({ name: "", relation: "", phone: "", email: "" });

  function setV<K extends keyof typeof vehicle>(field: K, value: (typeof vehicle)[K]) {
    setVehicle((prev) => ({ ...prev, [field]: value }));
  }
  function setC(field: keyof typeof contact, value: string) {
    setContact((prev) => ({ ...prev, [field]: value }));
  }

  function handleVehicleNext(e: React.FormEvent) {
    e.preventDefault();
    setStep("contact");
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await claimPlaceholderVehicle(qrId, {
      ownerPhone,
      vehicle: {
        vehicle_number: vehicle.vehicle_number,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year ? Number(vehicle.year) : undefined,
      },
      contact,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Claim failed");
      return;
    }

    toast.success("Sticker claimed! Your vehicle is now protected.");
    router.push(`/dashboard/vehicles/${result.data!.vehicleId}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="font-bold text-blue-600 text-lg tracking-tight">SafeRide QR</span>
        </div>

        <Card className="border-blue-200 mb-4">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <PartyPopper className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              This sticker is already protecting a vehicle. Add your own details below to make it
              yours.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6">
            {step === "vehicle" && (
              <form onSubmit={handleVehicleNext} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-blue-500" />
                  <h1 className="font-bold text-gray-900">Vehicle details</h1>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vehicle_number">Vehicle number</Label>
                  <Input
                    id="vehicle_number"
                    placeholder="MH12AB1234"
                    value={vehicle.vehicle_number}
                    onChange={(e) => setV("vehicle_number", e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type">Vehicle type</Label>
                  <select
                    id="type"
                    value={vehicle.type}
                    onChange={(e) => setV("type", e.target.value as VehicleType)}
                    className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  >
                    {vehicleTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      placeholder="Honda"
                      value={vehicle.brand}
                      onChange={(e) => setV("brand", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="Activa"
                      value={vehicle.model}
                      onChange={(e) => setV("model", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="Red"
                      value={vehicle.color}
                      onChange={(e) => setV("color", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Year (optional)</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2022"
                      value={vehicle.year}
                      onChange={(e) => setV("year", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="owner_phone">Your mobile number</Label>
                  <Input
                    id="owner_phone"
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <p className="text-xs text-gray-400">Used to send you scan alerts by SMS/WhatsApp.</p>
                </div>

                <SubmitButton className="w-full">Continue</SubmitButton>
              </form>
            )}

            {step === "contact" && (
              <form onSubmit={handleFinish} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep("vehicle")}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <h1 className="font-bold text-gray-900">Emergency contact</h1>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  This person will be contacted if someone triggers Emergency Mode on your sticker.
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_name">Name</Label>
                  <Input
                    id="contact_name"
                    value={contact.name}
                    onChange={(e) => setC("name", e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_relation">Relation</Label>
                    <Input
                      id="contact_relation"
                      placeholder="Father, Spouse..."
                      value={contact.relation}
                      onChange={(e) => setC("relation", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      maxLength={10}
                      value={contact.phone}
                      onChange={(e) => setC("phone", e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">Email (optional)</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="relative@example.com"
                    value={contact.email}
                    onChange={(e) => setC("email", e.target.value)}
                  />
                </div>

                <SubmitButton loading={loading} className="w-full">
                  Claim this sticker
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
