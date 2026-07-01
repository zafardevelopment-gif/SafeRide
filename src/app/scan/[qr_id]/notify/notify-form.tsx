"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Megaphone, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { createNotifyScan } from "@/actions/scan";

export default function NotifyForm({ qrId }: { qrId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createNotifyScan(qrId, message);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to send notification");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="font-bold text-blue-600 text-lg tracking-tight">SafeRide QR</span>
        </div>

        {sent ? (
          <Card className="border-green-200">
            <CardContent className="py-10 flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-semibold text-gray-900">Owner notified</p>
              <p className="text-sm text-gray-500">
                Thanks for looking out. The vehicle owner has been alerted with your message.
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
                <Megaphone className="w-4 h-4 text-blue-500" />
                <h1 className="font-bold text-gray-900">Notify the owner</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="message">Your message</Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    autoFocus
                    placeholder="e.g. Your headlights are on"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                  />
                </div>
                <SubmitButton loading={loading} className="w-full">
                  Send to owner
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
