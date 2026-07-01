"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateVehicle } from "@/actions/vehicle";
import SubmitButton from "@/components/shared/submit-button";
import type { Vehicle, VehicleType } from "@/types";

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "car", label: "Car" },
  { value: "auto", label: "Auto" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
];

export default function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: vehicle.vehicle_number,
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    year: vehicle.year ? String(vehicle.year) : "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateVehicle(vehicle.id, {
      vehicle_number: form.vehicle_number,
      type: form.type as VehicleType,
      brand: form.brand,
      model: form.model,
      color: form.color,
      year: form.year ? Number(form.year) : undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update vehicle");
      return;
    }
    toast.success("Vehicle updated!");
    router.push(`/dashboard/vehicles/${vehicle.id}`);
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/vehicles/${vehicle.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to vehicle
      </Link>

      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">Edit vehicle</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_number">Vehicle number</Label>
              <Input
                id="vehicle_number"
                value={form.vehicle_number}
                onChange={(e) => set("vehicle_number", e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Vehicle type</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
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
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
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
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                />
              </div>
            </div>

            <SubmitButton loading={loading} className="w-full">
              Save changes
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
