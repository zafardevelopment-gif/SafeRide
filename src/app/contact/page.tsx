import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

export const metadata = { title: "Contact — SafeRide QR" };

export default function ContactPage() {
  const supportEmail = process.env.ADMIN_EMAIL ?? "admin@saferideqr.in";

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-blue-600 text-lg tracking-tight">
            SafeRide QR
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Get in touch</h1>
        <p className="text-gray-500 mb-8">
          Questions about activation, lost stickers, agent payouts, or anything else — we're happy
          to help.
        </p>

        <Card>
          <CardContent className="py-6 flex flex-col items-center gap-3">
            <Mail className="w-8 h-8 text-blue-500" />
            <a
              href={`mailto:${supportEmail}`}
              className="text-lg font-semibold text-blue-600 hover:underline"
            >
              {supportEmail}
            </a>
            <p className="text-sm text-gray-400">We typically respond within 1-2 business days.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
