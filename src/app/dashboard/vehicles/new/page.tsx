"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVehicle } from "@/actions/vehicle";
import SubmitButton from "@/components/shared/submit-button";
import type { VehicleType } from "@/types";

const vehicleTypes: { value: VehicleType; label: string; emoji: string }[] = [
  { value: "bike", label: "Bike", emoji: "🏍️" },
  { value: "scooter", label: "Scooter", emoji: "🛵" },
  { value: "car", label: "Car", emoji: "🚗" },
  { value: "auto", label: "Auto", emoji: "🛺" },
  { value: "truck", label: "Truck", emoji: "🚚" },
  { value: "other", label: "Other", emoji: "🚘" },
];

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: "",
    type: "bike" as VehicleType,
    brand: "",
    model: "",
    color: "",
    year: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createVehicle({
      vehicle_number: form.vehicle_number,
      type: form.type,
      brand: form.brand,
      model: form.model,
      color: form.color,
      year: form.year ? Number(form.year) : undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to add vehicle");
      return;
    }
    toast.success("Vehicle added!");
    router.push(`/dashboard/vehicles/${result.data!.id}`);
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to vehicles
      </Link>

      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="pt-6 pb-6">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xl shadow-md shadow-blue-600/20">
              🚙
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Add a vehicle</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                You'll be able to link a QR sticker to it afterwards ✨
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_number">Vehicle number</Label>
              <Input
                id="vehicle_number"
                placeholder="MH12AB1234"
                value={form.vehicle_number}
                onChange={(e) => set("vehicle_number", e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Vehicle type</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {vehicleTypes.map((t) => {
                  const selected = form.type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("type", t.value)}
                      aria-pressed={selected}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all ${
                        selected
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100 ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40"
                      }`}
                    >
                      <span className="text-xl" aria-hidden>{t.emoji}</span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="Honda"
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="Activa"
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
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
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Year (optional)</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2022"
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                />
              </div>
            </div>

            <SubmitButton
              loading={loading}
              className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/25 hover:brightness-110"
            >
              Add vehicle 🎉
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
