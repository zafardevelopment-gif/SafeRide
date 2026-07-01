import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PWAInstallBanner from "@/components/shared/pwa-install-banner";
import ScanQrButton from "@/components/shared/scan-qr-button";

// Inline link-styled buttons — Base UI Button doesn't support asChild
function NavLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-lg px-3 h-7 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          : "inline-flex items-center justify-center rounded-lg px-3 h-7 text-sm font-medium hover:bg-muted transition-colors"
      }
    >
      {children}
    </Link>
  );
}

function CTALink({ href, children, outline = false }: { href: string; children: React.ReactNode; outline?: boolean }) {
  return (
    <Link
      href={href}
      className={
        outline
          ? "inline-flex items-center justify-center rounded-lg border border-border px-5 h-9 text-sm font-medium bg-background hover:bg-muted transition-colors"
          : "inline-flex items-center justify-center rounded-lg px-5 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
      }
    >
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <PWAInstallBanner />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-blue-600 text-lg tracking-tight">
            SafeRide QR
          </span>
          <div className="flex gap-2">
            <NavLink href="/login">Login</NavLink>
            <NavLink href="/signup" primary>Get Started</NavLink>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
        <Badge variant="secondary" className="mb-4">
          🇮🇳 Made for India
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight max-w-2xl">
          Your vehicle speaks.{" "}
          <span className="text-blue-600">You stay safe.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl">
          Stick a smart QR on your bike, car, or scooter. When someone scans it,
          you get an instant alert — without ever sharing your phone number.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <CTALink href="/signup">Buy a QR Sticker</CTALink>
          <ScanQrButton />
          <CTALink href="#how-it-works" outline>See How It Works</CTALink>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Buy & Stick",
                desc: "Order your QR sticker online or from a local agent. Stick it on your vehicle.",
                icon: "🏷️",
              },
              {
                step: "2",
                title: "Scan & Activate",
                desc: "Scan the sticker with any phone camera. Fill in your vehicle and emergency details in 2 minutes.",
                icon: "📱",
              },
              {
                step: "3",
                title: "Stay Protected",
                desc: "Anyone who scans your sticker can alert you or emergency contacts — without seeing your number.",
                icon: "🛡️",
              },
            ].map((item) => (
              <Card key={item.step} className="text-center border-0 shadow-sm">
                <CardContent className="pt-8 pb-6">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">
                    Step {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            3 Ways a Scanner Can Help You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "📣",
                title: "Notify Owner",
                desc: "Got a message? Leave a note — owner gets an SMS + WhatsApp alert instantly.",
                color: "bg-blue-50 border-blue-100",
              },
              {
                icon: "🚫",
                title: "Wrong Parking",
                desc: "Blocking a driveway? Report it with a photo and location — owner gets notified in seconds.",
                color: "bg-yellow-50 border-yellow-100",
              },
              {
                icon: "🚨",
                title: "Emergency Mode",
                desc: "Accident? Scanner sends the vehicle's location, blood group, and medical notes to all emergency contacts simultaneously.",
                color: "bg-red-50 border-red-100",
              },
            ].map((f) => (
              <Card key={f.title} className={`border ${f.color}`}>
                <CardContent className="pt-6 pb-5">
                  <div className="text-3xl mb-2">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to protect your vehicle?
        </h2>
        <p className="text-blue-100 mb-8 max-w-md mx-auto">
          Join thousands of Indian vehicle owners who ride smarter with SafeRide QR.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg px-6 h-10 font-medium bg-white text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Get Your QR Sticker →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-4 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} SafeRide QR. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600">Terms of Use</Link>
          <Link href="/faq" className="hover:text-gray-600">FAQ</Link>
          <Link href="/contact" className="hover:text-gray-600">Contact</Link>
        </div>
      </footer>
    </main>
  );
}
