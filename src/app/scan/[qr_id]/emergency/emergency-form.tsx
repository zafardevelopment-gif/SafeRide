"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ShieldAlert, Phone, Siren, HeartPulse, Shield, Flame, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SubmitButton from "@/components/shared/submit-button";
import { createEmergencyScan } from "@/actions/scan";
import { getCurrentLocation } from "@/lib/geolocation";

const helplines = [
  { label: "National Emergency", hindi: "राष्ट्रीय आपातकालीन", number: "112", icon: Siren },
  { label: "Police", hindi: "पुलिस", number: "100", icon: Shield },
  { label: "Ambulance", hindi: "एम्बुलेंस", number: "108", icon: HeartPulse },
  { label: "Fire Brigade", hindi: "फायर ब्रिगेड", number: "101", icon: Flame },
  { label: "Highway Help (NHAI)", hindi: "हाईवे सहायता", number: "1033", icon: Car },
  { label: "Women's Helpline", hindi: "महिला हेल्पलाइन", number: "1091", icon: Phone },
];

export default function EmergencyForm({ qrId }: { qrId: string }) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const location = await getCurrentLocation();
    const result = await createEmergencyScan(qrId, note, location?.lat, location?.lng);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to send emergency alert");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-bold text-blue-600 text-lg tracking-tight">SafeRide QR</span>
        </div>

        {sent ? (
          <div className="space-y-3">
            <Card className="border-red-200">
              <CardContent className="py-6 flex flex-col items-center text-center gap-2">
                <ShieldAlert className="w-10 h-10 text-red-500" />
                <p className="font-semibold text-gray-900">Emergency alert sent</p>
                <p className="text-sm text-gray-500">
                  All of the owner's emergency contacts have been notified with your location.
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="py-4">
                <p className="text-xs font-semibold text-red-700 mb-3">
                  If this is a medical or road emergency, call for help now:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {helplines.map((h) => (
                    <a
                      key={h.number}
                      href={`tel:${h.number}`}
                      className="flex items-center gap-2 rounded-lg bg-white border border-red-100 px-3 py-2 hover:bg-red-50 transition-colors"
                    >
                      <h.icon className="w-4 h-4 text-red-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-900 leading-tight">{h.label}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">{h.hindi}</p>
                        <p className="text-sm font-bold text-red-600">{h.number}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Link
              href={`/scan/${qrId}`}
              className="block text-center text-sm text-blue-600 hover:underline font-medium"
            >
              Back to sticker
            </Link>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 pb-6">
              <Link
                href={`/scan/${qrId}`}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </Link>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h1 className="font-bold text-gray-900">Emergency</h1>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                This will immediately alert all of the owner's emergency contacts with your
                location. Only use this for genuine accidents or emergencies.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="What happened? (optional)"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none"
                />
                <SubmitButton
                  loading={loading}
                  className="w-full bg-red-600 hover:bg-red-600/90"
                >
                  Send Emergency Alert
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
