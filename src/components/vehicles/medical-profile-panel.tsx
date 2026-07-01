"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HeartPulse, Pencil, X, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { upsertMedicalProfile, deleteMedicalProfile } from "@/actions/medical-profile";
import type { MedicalProfile } from "@/types";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

interface MedicalProfilePanelProps {
  vehicleId: string;
  initialProfile: MedicalProfile | null;
}

export default function MedicalProfilePanel({ vehicleId, initialProfile }: MedicalProfilePanelProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    blood_group: initialProfile?.blood_group ?? "",
    allergies: initialProfile?.allergies ?? "",
    conditions: initialProfile?.conditions ?? "",
    notes: initialProfile?.notes ?? "",
    consent_given: initialProfile?.consent_given ?? false,
  });

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consent_given) {
      toast.error("You must consent to store medical data");
      return;
    }
    setLoading(true);
    const result = await upsertMedicalProfile(vehicleId, {
      blood_group: form.blood_group ? (form.blood_group as (typeof bloodGroups)[number]) : undefined,
      allergies: form.allergies || undefined,
      conditions: form.conditions || undefined,
      notes: form.notes || undefined,
      consent_given: true,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save medical profile");
      return;
    }
    setProfile(result.data!);
    setEditing(false);
    toast.success("Medical profile saved");
  }

  async function handleDelete() {
    if (!confirm("Remove your medical profile? This revokes your consent and deletes the stored data.")) return;
    setLoading(true);
    const result = await deleteMedicalProfile(vehicleId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to remove medical profile");
      return;
    }
    setProfile(null);
    setForm({ blood_group: "", allergies: "", conditions: "", notes: "", consent_given: false });
    toast.success("Medical profile removed");
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-red-500" />
            Medical Profile
            <span className="text-xs font-normal text-gray-400">(optional)</span>
          </h2>
          {!editing && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Pencil className="w-3.5 h-3.5" />
                {profile ? "Edit" : "Add"}
              </button>
              {profile && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        {!editing && (
          profile ? (
            <div className="text-sm text-gray-600 space-y-1">
              {profile.blood_group && <p>Blood group: <span className="font-medium text-gray-900">{profile.blood_group}</span></p>}
              {profile.allergies && <p>Allergies: {profile.allergies}</p>}
              {profile.conditions && <p>Conditions: {profile.conditions}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Only shared with emergency contacts during Emergency Mode — never shown to a regular scanner.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Not added. Sharing blood group and medical notes can help responders in an emergency.
            </p>
          )
        )}

        {editing && (
          <form onSubmit={handleSave} className="space-y-3 rounded-lg border border-red-100 bg-red-50/30 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">Medical details</p>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blood_group">Blood group</Label>
              <select
                id="blood_group"
                value={form.blood_group}
                onChange={(e) => set("blood_group", e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="">Select</option>
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
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conditions">Existing conditions</Label>
              <Input
                id="conditions"
                placeholder="Diabetes, asthma..."
                value={form.conditions}
                onChange={(e) => set("conditions", e.target.value)}
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={form.consent_given}
                onChange={(e) => set("consent_given", e.target.checked)}
                className="mt-0.5"
              />
              I consent to storing this medical data and sharing it with my emergency contacts only during Emergency Mode, per the DPDP Act 2023.
            </label>

            <SubmitButton loading={loading} className="w-full">
              Save medical profile
            </SubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
