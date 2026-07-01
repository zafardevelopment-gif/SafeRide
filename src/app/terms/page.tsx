import Link from "next/link";

export const metadata = { title: "Terms of Use — SafeRide QR" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-blue-600 text-lg tracking-tight">
            SafeRide QR
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString("en-IN")}</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. The service</h2>
            <p>
              SafeRide QR provides QR stickers that, when scanned, let another person notify a
              vehicle's registered owner, report a parking issue, or trigger an emergency alert to
              the owner's emergency contacts — without ever revealing the owner's contact details to
              the scanner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Activation</h2>
            <p>
              A QR sticker is inert until the vehicle owner activates it by registering their vehicle
              details and at least one emergency contact. Only the person who activates a sticker is
              treated as its registered owner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Lost or damaged stickers</h2>
            <p>
              If your sticker is lost, stolen, or damaged, report it from your dashboard immediately.
              The sticker will be suspended to prevent misuse. Replacement stickers may carry a fee.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Acceptable use</h2>
            <p>
              Do not use the scan actions (Notify Owner, Wrong Parking, Emergency) for harassment,
              spam, or false emergency reports. Abuse may result in your access being restricted and,
              where applicable, reported to authorities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Emergency Mode is not a replacement for emergency services</h2>
            <p>
              Emergency Mode notifies your registered emergency contacts. It does not contact police,
              ambulance, or fire services directly. In a genuine emergency, always call the relevant
              helpline first — see the numbers shown after triggering Emergency Mode.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. No masked calling</h2>
            <p>
              This version of SafeRide QR does not support masked/anonymous phone calls between
              scanners and owners. All communication happens via SMS, WhatsApp, and email
              notifications only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Limitation of liability</h2>
            <p>
              SafeRide QR is a notification and information-sharing tool. We do not guarantee that
              notifications will always be delivered instantly or that any specific outcome will
              result from a scan. We are not liable for actions taken (or not taken) based on
              notifications sent through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after a
              change constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Contact</h2>
            <p>
              Questions about these terms? Visit our{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
