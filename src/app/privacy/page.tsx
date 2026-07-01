import Link from "next/link";

export const metadata = { title: "Privacy Policy — SafeRide QR" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-blue-600 text-lg tracking-tight">
            SafeRide QR
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm sm:prose-base">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString("en-IN")}</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. What we collect</h2>
            <p>
              When you activate a SafeRide QR sticker, we collect your vehicle details (registration
              number, type, brand, model, color), your name, phone number, and email. If you choose to
              add emergency contacts, we collect their name, relationship to you, and phone number.
            </p>
            <p className="mt-2">
              Medical information (blood group, allergies, medical conditions) is entirely optional and
              is only stored if you explicitly consent, per the Digital Personal Data Protection Act,
              2023 ("DPDP Act"). You may add or remove this information at any time from your dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. How we use it</h2>
            <p>
              Your vehicle and contact information is used solely to operate the SafeRide QR service —
              notifying you when someone scans your sticker, and, only in Emergency Mode, sharing your
              emergency contacts' details and medical information (if provided) with those contacts.
            </p>
            <p className="mt-2">
              Anyone who scans your QR sticker never sees your phone number, email, or personal
              details. Scanners can only send you a message, report a parking issue, or trigger
              Emergency Mode — none of these reveal your identity to them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. When medical data is disclosed</h2>
            <p>
              Medical information you provide is never shown to a regular scanner. It is only included
              in the alert sent to your registered emergency contacts if Emergency Mode is triggered on
              your sticker.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Data retention &amp; deletion</h2>
            <p>
              We retain your data for as long as your account is active. You can request deletion of
              your account, vehicles, and associated data at any time by contacting us — see our{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">Contact page</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Your rights</h2>
            <p>
              Under the DPDP Act, you have the right to access, correct, and request erasure of your
              personal data. You may withdraw consent for medical data storage at any time without
              affecting the rest of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Contact</h2>
            <p>
              For privacy-related questions or data requests, reach us via the{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
