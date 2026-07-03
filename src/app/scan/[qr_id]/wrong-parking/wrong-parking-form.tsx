"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, MapPin, CheckCircle2, LocateFixed, Camera, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { createWrongParkingScan } from "@/actions/scan";
import { getCurrentLocation } from "@/lib/geolocation";
import { uploadScanPhoto } from "@/lib/scan-photo-upload";

const reasons = [
  { value: "blocking gate", label: "Blocking a gate/driveway" },
  { value: "lights on", label: "Lights left on" },
  { value: "towing", label: "Vehicle needs towing" },
  { value: "wrong parking", label: "Wrong parking spot" },
  { value: "other", label: "Other" },
];

export default function WrongParkingForm({ qrId }: { qrId: string }) {
  const searchParams = useSearchParams();
  const presetReason = searchParams.get("reason");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [reason, setReason] = useState(
    reasons.some((r) => r.value === presetReason) ? presetReason! : reasons[0].value
  );
  const [note, setNote] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sent, setSent] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleShareLocation() {
    setLocating(true);
    const loc = await getCurrentLocation();
    setLocating(false);
    if (!loc) {
      toast.error("Couldn't get your location. You can still submit without it.");
      return;
    }
    setLocation(loc);
    toast.success("Location captured");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let photoUrl: string | undefined;
    if (photoFile) {
      setUploadingPhoto(true);
      const uploaded = await uploadScanPhoto(photoFile, qrId);
      setUploadingPhoto(false);
      if (!uploaded) {
        setLoading(false);
        toast.error("Couldn't upload photo. You can submit without it.");
        return;
      }
      photoUrl = uploaded;
    }

    const result = await createWrongParkingScan(qrId, reason, note, location?.lat, location?.lng, photoUrl);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to report");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-bold text-blue-600 text-lg tracking-tight">SafeRide QR</span>
        </div>

        {sent ? (
          <Card className="border-green-200">
            <CardContent className="py-10 flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-semibold text-gray-900">Report sent</p>
              <p className="text-sm text-gray-500">
                Thanks for reporting. The vehicle owner has been notified.
              </p>
              <Link
                href={`/scan/${qrId}`}
                className="mt-2 text-sm text-blue-600 hover:underline font-medium"
              >
                Back to sticker
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 pb-6">
              <Link
                href={`/scan/${qrId}`}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </Link>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-amber-500" />
                <h1 className="font-bold text-gray-900">Report wrong parking</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Reason</Label>
                  <select
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  >
                    {reasons.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note">Additional note (optional)</Label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Photo proof (optional)</Label>
                  {photoPreview ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                      <Image src={photoPreview} alt="Report photo" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
                        aria-label="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 h-9 text-sm font-medium border border-border bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Add photo
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={locating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 h-9 text-sm font-medium border border-border bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <LocateFixed className="w-4 h-4" />
                  {location ? "Location shared" : locating ? "Getting location..." : "Share my location"}
                </button>

                <SubmitButton loading={loading || uploadingPhoto} className="w-full">
                  {uploadingPhoto ? "Uploading photo..." : "Submit report"}
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
