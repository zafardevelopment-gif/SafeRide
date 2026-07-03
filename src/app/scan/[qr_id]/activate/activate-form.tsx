"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Phone, HeartPulse, ArrowLeft, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { activateQRCode, linkExistingVehicle } from "@/actions/activate-qr";
import type { VehicleType } from "@/types";

type Step = "choose" | "vehicle" | "contact" | "medical";

interface ExistingVehicle {
  id: string;
  vehicle_number: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  year: number | null;
}

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "car", label: "Car" },
  { value: "auto", label: "Auto" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const steps: { key: Step; label: string }[] = [
  { key: "vehicle", label: "Vehicle" },
  { key: "contact", label: "Emergency Contact" },
  { key: "medical", label: "Medical (optional)" },
];

export default function ActivateForm({
  qrId,
  existingVehicles,
}: {
  qrId: string;
  existingVehicles: ExistingVehicle[];
}) {
  const router = useRouter();
  const hasExisting = existingVehicles.length > 0;
  const [step, setStep] = useState<Step>(hasExisting ? "choose" : "vehicle");
  const [loading, setLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("new");
  const [linking, setLinking] = useState(false);

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
  const [medical, setMedical] = useState({
    blood_group: "",
    allergies: "",
    conditions: "",
    notes: "",
    consent_given: false,
  });

  const stepIndex = steps.findIndex((s) => s.key === step);

  function setV<K extends keyof typeof vehicle>(field: K, value: (typeof vehicle)[K]) {
    setVehicle((prev) => ({ ...prev, [field]: value }));
  }
  function setC(field: keyof typeof contact, value: string) {
    setContact((prev) => ({ ...prev, [field]: value }));
  }
  function setM<K extends keyof typeof medical>(field: K, value: (typeof medical)[K]) {
    setMedical((prev) => ({ ...prev, [field]: value }));
  }

  async function handleChooseNext(e: React.FormEvent) {
    e.preventDefault();
    if (selectedVehicleId === "new") {
      setStep("vehicle");
      return;
    }

    setLinking(true);
    const result = await linkExistingVehicle(qrId, selectedVehicleId);
    setLinking(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to link vehicle");
      return;
    }

    toast.success("Sticker activated and linked to your vehicle!");
    router.push(`/dashboard/vehicles/${result.data!.vehicleId}`);
  }

  function handleVehicleNext(e: React.FormEvent) {
    e.preventDefault();
    setStep("contact");
  }

  function handleContactNext(e: React.FormEvent) {
    e.preventDefault();
    setStep("medical");
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    if ((medical.blood_group || medical.allergies || medical.conditions) && !medical.consent_given) {
      toast.error("Please consent to store medical data, or clear those fields.");
      return;
    }

    setLoading(true);
    const result = await activateQRCode(qrId, {
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
      medical: medical.consent_given
        ? {
            blood_group: medical.blood_group || undefined,
            allergies: medical.allergies || undefined,
            conditions: medical.conditions || undefined,
            notes: medical.notes || undefined,
            consent_given: true,
          }
        : undefined,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Activation failed");
      return;
    }

    toast.success("Sticker activated! Your vehicle is now protected.");
    router.push(`/dashboard/vehicles/${result.data!.vehicleId}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="font-bold text-blue-600 text-lg tracking-tight">SafeRide QR</span>
        </div>

        {/* Step indicator */}
        {step !== "choose" && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i <= stepIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < stepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        )}

        <Card>
          <CardContent className="pt-6 pb-6">
            {step === "choose" && (
              <form onSubmit={handleChooseNext} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-blue-500" />
                  <h1 className="font-bold text-gray-900">Link a vehicle</h1>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  You already have {existingVehicles.length === 1 ? "a vehicle" : "vehicles"} registered.
                  Link this sticker to an existing vehicle, or add a new one.
                </p>

                <div className="space-y-2">
                  {existingVehicles.map((v) => (
                    <label
                      key={v.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedVehicleId === v.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-border hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="vehicle_choice"
                        value={v.id}
                        checked={selectedVehicleId === v.id}
                        onChange={() => setSelectedVehicleId(v.id)}
                        className="shrink-0"
                      />
                      <Car className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{v.vehicle_number}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {v.brand} {v.model} &middot; {v.color}
                        </p>
                      </div>
                    </label>
                  ))}

                  <label
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedVehicleId === "new"
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicle_choice"
                      value="new"
                      checked={selectedVehicleId === "new"}
                      onChange={() => setSelectedVehicleId("new")}
                      className="shrink-0"
                    />
                    <PlusCircle className="w-4 h-4 text-gray-400 shrink-0" />
                    <p className="text-sm font-semibold text-gray-900">Add a new vehicle</p>
                  </label>
                </div>

                <SubmitButton loading={linking} className="w-full">
                  Continue
                </SubmitButton>
              </form>
            )}

            {step === "vehicle" && (
              <form onSubmit={handleVehicleNext} className="space-y-4">
                {hasExisting && (
                  <button
                    type="button"
                    onClick={() => setStep("choose")}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
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
              <form onSubmit={handleContactNext} className="space-y-4">
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
                  <p className="text-xs text-gray-400">
                    If added, they'll also get an email alert during Emergency Mode.
                  </p>
                </div>

                <SubmitButton className="w-full">Continue</SubmitButton>
              </form>
            )}

            {step === "medical" && (
              <form onSubmit={handleFinish} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep("contact")}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="w-4 h-4 text-red-500" />
                  <h1 className="font-bold text-gray-900">Medical profile</h1>
                  <span className="text-xs font-normal text-gray-400">(optional)</span>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  Only shared with your emergency contacts during Emergency Mode — never shown to a
                  regular scanner. You can skip this and add it later.
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="blood_group">Blood group</Label>
                  <select
                    id="blood_group"
                    value={medical.blood_group}
                    onChange={(e) => setM("blood_group", e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  >
                    <option value="">Select (optional)</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    placeholder="Penicillin, peanuts..."
                    value={medical.allergies}
                    onChange={(e) => setM("allergies", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conditions">Existing conditions</Label>
                  <Input
                    id="conditions"
                    placeholder="Diabetes, asthma..."
                    value={medical.conditions}
                    onChange={(e) => setM("conditions", e.target.value)}
                  />
                </div>

                {(medical.blood_group || medical.allergies || medical.conditions) && (
                  <label className="flex items-start gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={medical.consent_given}
                      onChange={(e) => setM("consent_given", e.target.checked)}
                      className="mt-0.5"
                    />
                    I consent to storing this medical data and sharing it with my emergency contacts
                    only during Emergency Mode, per the DPDP Act 2023.
                  </label>
                )}

                <SubmitButton loading={loading} className="w-full">
                  Activate sticker
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
