"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { adminActivateQRCode } from "@/actions/admin-activate";
import type { VehicleType } from "@/types";

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "car", label: "Car" },
  { value: "auto", label: "Auto" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
];

interface AdminActivateModalProps {
  qrId: string;
  onClose: () => void;
  onActivated: () => void;
}

export default function AdminActivateModal({ qrId, onClose, onActivated }: AdminActivateModalProps) {
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState(true);
  const [vehicle, setVehicle] = useState({
    vehicle_number: "",
    type: "bike" as VehicleType,
    brand: "",
    model: "",
    color: "",
    year: "",
  });
  const [contact, setContact] = useState({ name: "", relation: "", phone: "" });

  function setV<K extends keyof typeof vehicle>(field: K, value: (typeof vehicle)[K]) {
    setVehicle((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle.vehicle_number.trim() || !vehicle.brand.trim() || !vehicle.model.trim() || !vehicle.color.trim()) {
      toast.error("Vehicle number, brand, model, and color are required.");
      return;
    }

    setLoading(true);
    const result = await adminActivateQRCode(qrId, {
      vehicle: {
        vehicle_number: vehicle.vehicle_number,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year ? Number(vehicle.year) : undefined,
      },
      contact: placeholder ? undefined : contact,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Activation failed");
      return;
    }

    toast.success("Sticker activated. The real owner can claim it later by scanning.");
    onActivated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <span className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-500" />
            Activate SRQ-{qrId} manually
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-gray-500">
            Use this for phone orders or to pre-activate stock (e.g. before selling via Amazon). The
            sticker goes live under a placeholder owner — whoever scans it later can claim it with
            their own details.
          </p>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={placeholder}
              onChange={(e) => setPlaceholder(e.target.checked)}
            />
            Generic placeholder stock (no real customer yet — e.g. Amazon prep)
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="am_vehicle_number">Vehicle number</Label>
            <Input
              id="am_vehicle_number"
              placeholder="MH12AB1234"
              value={vehicle.vehicle_number}
              onChange={(e) => setV("vehicle_number", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="am_type">Vehicle type</Label>
            <select
              id="am_type"
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
              <Label htmlFor="am_brand">Brand</Label>
              <Input id="am_brand" placeholder="Honda" value={vehicle.brand} onChange={(e) => setV("brand", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am_model">Model</Label>
              <Input id="am_model" placeholder="Activa" value={vehicle.model} onChange={(e) => setV("model", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="am_color">Color</Label>
              <Input id="am_color" placeholder="Red" value={vehicle.color} onChange={(e) => setV("color", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am_year">Year (optional)</Label>
              <Input id="am_year" type="number" placeholder="2022" value={vehicle.year} onChange={(e) => setV("year", e.target.value)} />
            </div>
          </div>

          {!placeholder && (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-gray-700">Emergency contact (from customer)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="am_contact_name">Name</Label>
                  <Input
                    id="am_contact_name"
                    value={contact.name}
                    onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="am_contact_relation">Relation</Label>
                  <Input
                    id="am_contact_relation"
                    value={contact.relation}
                    onChange={(e) => setContact((p) => ({ ...p, relation: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="am_contact_phone">Phone</Label>
                <Input
                  id="am_contact_phone"
                  type="tel"
                  maxLength={10}
                  value={contact.phone}
                  onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                  required
                />
              </div>
            </div>
          )}

          <SubmitButton loading={loading} className="w-full">
            Activate
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
