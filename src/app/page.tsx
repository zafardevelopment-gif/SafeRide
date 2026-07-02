import Link from "next/link";
import { ArrowRight, MapPinOff, MessageSquareWarning, ShieldAlert, Sparkles, Tag, ScanLine, ShieldCheck, Star, Zap, Lock } from "lucide-react";
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
          ? "inline-flex items-center justify-center rounded-full px-4 h-8 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          : "inline-flex items-center justify-center rounded-full px-4 h-8 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
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
          ? "inline-flex items-center justify-center rounded-full border border-slate-200 px-6 h-11 text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          : "inline-flex items-center justify-center gap-1.5 rounded-full px-6 h-11 text-sm font-medium bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors"
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
      <nav className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold text-slate-900 text-lg tracking-tight">
            <ShieldCheck className="size-5 text-blue-600" strokeWidth={2.25} />
            SafeRide QR
          </span>
          <div className="flex gap-2">
            <NavLink href="/login">Login</NavLink>
            <NavLink href="/signup" primary>Get Started</NavLink>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28 overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,theme(colors.blue.100),transparent)]"
        />
        <Badge variant="secondary" className="mb-5 gap-1.5 border border-blue-100 bg-blue-50 text-blue-700 px-3 py-1">
          <Sparkles className="size-3.5" />
          Made for India
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-semibold text-slate-900 leading-[1.1] tracking-tight max-w-2xl text-balance">
          Your vehicle speaks.{" "}
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            You stay safe.
          </span>
        </h1>
        <p className="mt-5 text-lg text-slate-500 max-w-xl text-balance">
          Stick a smart QR on your bike, car, or scooter. When someone scans it,
          you get an instant alert — without ever sharing your phone number.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <CTALink href="/signup">Buy a QR Sticker</CTALink>
          <ScanQrButton />
          <CTALink href="#how-it-works" outline>See How It Works</CTALink>
        </div>

        {/* Trust bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <span className="font-medium text-slate-700">4.8/5</span>
            <span>from 2,000+ riders</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-blue-600" />
            <span>Instant SMS + WhatsApp alerts</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Lock className="size-4 text-blue-600" />
            <span>Your number stays private</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center text-slate-900 tracking-tight mb-14">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Buy & Stick",
                desc: "Order your QR sticker online or from a local agent. Stick it on your vehicle.",
                icon: Tag,
              },
              {
                step: "2",
                title: "Scan & Activate",
                desc: "Scan the sticker with any phone camera. Fill in your vehicle and emergency details in 2 minutes.",
                icon: ScanLine,
              },
              {
                step: "3",
                title: "Stay Protected",
                desc: "Anyone who scans your sticker can alert you or emergency contacts — without seeing your number.",
                icon: ShieldCheck,
              },
            ].map((item) => (
              <Card key={item.step} className="text-center border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-10 pb-8">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <item.icon className="size-6" strokeWidth={1.75} />
                  </div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1.5">
                    Step {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center text-slate-900 tracking-tight mb-14">
            3 Ways a Scanner Can Help You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquareWarning,
                title: "Notify Owner",
                desc: "Got a message? Leave a note — owner gets an SMS + WhatsApp alert instantly.",
                iconBg: "bg-blue-50 text-blue-600",
              },
              {
                icon: MapPinOff,
                title: "Wrong Parking",
                desc: "Blocking a driveway? Report it with a photo and location — owner gets notified in seconds.",
                iconBg: "bg-amber-50 text-amber-600",
              },
              {
                icon: ShieldAlert,
                title: "Emergency Mode",
                desc: "Accident? Scanner sends the vehicle's location, blood group, and medical notes to all emergency contacts simultaneously.",
                iconBg: "bg-red-50 text-red-600",
              },
            ].map((f) => (
              <Card key={f.title} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardContent className="pt-8 pb-7">
                  <div className={`mb-4 flex size-11 items-center justify-center rounded-xl ${f.iconBg}`}>
                    <f.icon className="size-5.5" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-28 px-4 text-center overflow-hidden bg-slate-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,theme(colors.blue.600/.35),transparent)]"
        />
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">
            Ready to protect your vehicle?
          </h2>
          <p className="text-slate-400 mb-9 max-w-md mx-auto text-balance">
            Join thousands of Indian vehicle owners who ride smarter with SafeRide QR.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-7 h-11 font-medium bg-white text-slate-900 shadow-lg hover:bg-slate-100 transition-colors"
          >
            Get Your QR Sticker
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} SafeRide QR. All rights reserved.</p>
        <div className="flex justify-center gap-5 mt-3">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Use</Link>
          <Link href="/faq" className="hover:text-slate-600 transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-slate-600 transition-colors">Contact</Link>
        </div>
      </footer>
    </main>
  );
}
