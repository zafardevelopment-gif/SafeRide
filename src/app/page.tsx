import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Lock,
  MapPinOff,
  MessageSquareWarning,
  Quote,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Zap,
} from "lucide-react";
import PWAInstallBanner from "@/components/shared/pwa-install-banner";
import ScanQrButton from "@/components/shared/scan-qr-button";

/* ---------- Small building blocks ---------- */

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hidden sm:inline-flex items-center px-3 h-9 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
    >
      {children}
    </Link>
  );
}

function FakeQr() {
  // Deterministic decorative QR pattern
  const cells = [
    "1111111010011111111","1000001011010000001","1011101001010111101","1011101110010111101",
    "1011101010110111101","1000001101010000001","1111111010111111111","0000000110100000000",
    "1010111011101011010","0110010101100101101","1101110010111011100","0011001101010110011",
    "1110110101101101110","0000000101011010101","1111111011010110101","1000001010111011010",
    "1011101101010101111","1011101011101110010","1011101010110101101",
  ];
  return (
    <svg viewBox="0 0 19 19" className="w-full h-full" aria-hidden>
      {cells.map((row, y) =>
        row.split("").map((c, x) =>
          c === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="0.92" height="0.92" rx="0.18" fill="currentColor" /> : null
        )
      )}
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[380px] select-none" aria-hidden>
      {/* Glow */}
      <div className="absolute -inset-8 rounded-[3rem] bg-blue-500/20 blur-3xl" />

      {/* Sticker card */}
      <div className="relative animate-float rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-6 shadow-2xl shadow-blue-950/50 backdrop-blur">
        <div className="flex items-center justify-between mb-5">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white tracking-tight">
            <ShieldCheck className="size-4 text-blue-400" />
            SafeRide QR
          </span>
          <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            ● Active
          </span>
        </div>

        <div className="relative mx-auto w-44 rounded-2xl bg-white p-4 text-slate-900 shadow-lg">
          <div className="absolute inset-0 rounded-2xl ring-4 ring-blue-500/30 animate-pulse-ring" />
          <FakeQr />
        </div>

        <p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Scan in emergency
        </p>
        <p className="mt-1 text-center text-xs text-slate-500">MH 12 • Protected vehicle</p>
      </div>

      {/* Floating alert card */}
      <div className="absolute -right-4 -bottom-8 sm:-right-10 w-64 animate-float [animation-delay:1.2s] rounded-2xl border border-white/10 bg-slate-800/95 p-4 shadow-xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
            <BellRing className="size-4.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Alert: Someone scanned your QR</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
              &ldquo;Your bike lights are on&rdquo; — sent via SMS + WhatsApp
            </p>
            <p className="mt-1 text-[10px] text-slate-500">Just now · Number stayed private</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page sections ---------- */

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <PWAInstallBanner />

      {/* ============ NAV ============ */}
      <nav className="sticky top-0 z-40 border-b border-slate-900/5 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/25">
              <ShieldCheck className="size-4.5" strokeWidth={2.25} />
            </span>
            SafeRide QR
          </Link>
          <div className="flex items-center gap-1">
            <NavLink href="#how-it-works">How it works</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#reviews">Reviews</NavLink>
            <NavLink href="/faq">FAQ</NavLink>
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-700 transition-colors"
              >
                Get Started
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-slate-950">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-slate" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_70%_20%,theme(colors.blue.600/.28),transparent),radial-gradient(ellipse_40%_40%_at_15%_80%,theme(colors.cyan.500/.14),transparent)]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:gap-8">
          <div className="text-center lg:text-left">
            <div className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-300">
              <Sparkles className="size-3.5" />
              Made for India · Trusted by 2,000+ riders
            </div>

            <h1 className="animate-fade-up [animation-delay:80ms] mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl text-balance">
              Your vehicle speaks.{" "}
              <span className="text-gradient-brand">You stay safe.</span>
            </h1>

            <p className="animate-fade-up [animation-delay:160ms] mx-auto lg:mx-0 mt-6 max-w-xl text-lg leading-relaxed text-slate-400 text-balance">
              Stick a smart QR on your bike, car, or scooter. When someone scans it,
              you get an instant alert — without ever sharing your phone number.
            </p>

            <div className="animate-fade-up [animation-delay:240ms] mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-500/40 hover:brightness-110"
              >
                Buy a QR Sticker
                <ArrowRight className="size-4" />
              </Link>
              <ScanQrButton className="h-12 rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10" />
            </div>

            <div className="animate-fade-up [animation-delay:320ms] mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-slate-400 lg:justify-start">
              <span className="flex items-center gap-1.5">
                <span className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </span>
                <span className="font-semibold text-white">4.8/5</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="size-4 text-blue-400" /> Instant SMS + WhatsApp
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-4 text-blue-400" /> Number stays private
              </span>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:200ms] pb-10 lg:pb-0">
            <HeroVisual />
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/5 bg-white/[0.02]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
            {[
              { value: "2,000+", label: "Protected riders" },
              { value: "10,000+", label: "Alerts delivered" },
              { value: "50+", label: "Cities across India" },
              { value: "< 5 sec", label: "Average alert time" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
              Protected in under 2 minutes
            </h2>
            <p className="mt-4 text-slate-500 text-balance">
              No app download needed for scanners. Any phone camera works.
            </p>
          </div>

          <div className="relative mt-16 grid gap-10 sm:grid-cols-3 sm:gap-6">
            <div aria-hidden className="absolute left-[16.67%] right-[16.67%] top-7 hidden border-t-2 border-dashed border-slate-200 sm:block" />
            {[
              { step: "01", title: "Buy & Stick", desc: "Order your QR sticker online or from a local agent. Peel and stick it on your vehicle.", icon: Tag },
              { step: "02", title: "Scan & Activate", desc: "Scan with any phone camera. Add your vehicle and emergency details in 2 minutes.", icon: ScanLine },
              { step: "03", title: "Stay Protected", desc: "Anyone who scans can alert you or your emergency contacts — without seeing your number.", icon: ShieldCheck },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="relative z-10 mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
                  <item.icon className="size-6" strokeWidth={1.75} />
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Step {item.step}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="border-y border-slate-100 bg-slate-50/70 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
              3 ways a scanner can help you
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: MessageSquareWarning,
                title: "Notify Owner",
                desc: "Lights on? Helmet left behind? Scanner leaves a note — you get an SMS + WhatsApp alert instantly.",
                accent: "from-blue-600 to-blue-400",
              },
              {
                icon: MapPinOff,
                title: "Wrong Parking",
                desc: "Blocking a gate or driveway? Get notified with photo and location in seconds — before the tow truck arrives.",
                accent: "from-amber-500 to-orange-400",
              },
              {
                icon: ShieldAlert,
                title: "Emergency Mode",
                desc: "In an accident, the scanner sends your location, blood group, and medical notes to all emergency contacts at once.",
                accent: "from-rose-600 to-red-400",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
              >
                <div className={`mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-md`}>
                  <f.icon className="size-5.5" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Secondary features */}
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Lock, title: "Privacy first", desc: "Scanners never see your phone number. All communication is masked through SafeRide." },
              { icon: Smartphone, title: "No app needed", desc: "Works with any phone camera — Android, iPhone, or a basic phone with a QR scanner." },
              { icon: CheckCircle2, title: "Weatherproof stickers", desc: "UV-resistant, waterproof vinyl built for Indian summers and monsoons." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border border-slate-200/60 bg-white/60 p-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <f.icon className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section id="reviews" className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Reviews</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
              Riders across India trust SafeRide
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                quote: "Someone alerted me my scooter was about to be towed near the market. Saved me ₹2,000 and half a day at the yard.",
                name: "Priya Sharma",
                meta: "Activa rider · Pune",
              },
              {
                quote: "Left my bike lights on at the office. Got a WhatsApp within a minute of a colleague scanning the sticker. Brilliant.",
                name: "Arjun Mehta",
                meta: "Pulsar rider · Bengaluru",
              },
              {
                quote: "After my father's accident, the scanner alerted all three of us with his exact location. This sticker is now on every family vehicle.",
                name: "Kavitha Reddy",
                meta: "Car owner · Hyderabad",
              },
            ].map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
                <Quote className="size-6 text-blue-200" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.meta}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-slate-950 px-4 py-20 text-center sm:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-slate" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,theme(colors.blue.600/.35),transparent)]"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
            Ready to protect your vehicle?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-slate-400 text-balance">
            Join thousands of Indian vehicle owners who ride smarter with SafeRide QR.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-slate-900 shadow-lg transition-colors hover:bg-slate-100"
            >
              Get Your QR Sticker
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Become an Agent
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-100 bg-white px-4 pb-10 pt-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-10 sm:flex-row">
            <div className="max-w-xs">
              <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                  <ShieldCheck className="size-4.5" strokeWidth={2.25} />
                </span>
                SafeRide QR
              </span>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Smart QR stickers that keep Indian vehicle owners connected, alerted, and safe — while keeping their numbers private.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Product</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How it works</Link></li>
                  <li><Link href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</Link></li>
                  <li><Link href="/signup" className="text-slate-600 hover:text-slate-900 transition-colors">Buy a sticker</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Support</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="/faq" className="text-slate-600 hover:text-slate-900 transition-colors">FAQ</Link></li>
                  <li><Link href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">Contact us</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors">Privacy policy</Link></li>
                  <li><Link href="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">Terms of use</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} SafeRide QR. All rights reserved.</p>
            <p>Made with care in India 🇮🇳</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
