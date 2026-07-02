import Link from "next/link";
import { ArrowLeft, Clock, Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";

export const metadata = { title: "Contact — SafeRide QR" };

const PHONE = "9204298771";
const PHONE_INTL = "919204298771";

export default function ContactPage() {
  const supportEmail = process.env.ADMIN_EMAIL ?? "mdzafareqbal@gmail.com";

  const channels = [
    {
      emoji: "📞",
      icon: Phone,
      title: "Call us",
      value: `+91 ${PHONE.slice(0, 5)} ${PHONE.slice(5)}`,
      href: `tel:+${PHONE_INTL}`,
      desc: "Mon–Sat, 9 AM – 7 PM IST",
      chip: "bg-blue-50 text-blue-600",
      cta: "Call now",
    },
    {
      emoji: "💬",
      icon: MessageCircle,
      title: "WhatsApp",
      value: `+91 ${PHONE.slice(0, 5)} ${PHONE.slice(5)}`,
      href: `https://wa.me/${PHONE_INTL}?text=Hi%20SafeRide%20QR%2C%20I%20need%20help`,
      desc: "Fastest way to reach us ⚡",
      chip: "bg-emerald-50 text-emerald-600",
      cta: "Chat on WhatsApp",
    },
    {
      emoji: "✉️",
      icon: Mail,
      title: "Email",
      value: supportEmail,
      href: `mailto:${supportEmail}`,
      desc: "We reply within 1–2 business days",
      chip: "bg-violet-50 text-violet-600",
      cta: "Send email",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-900/5 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/25">
              <ShieldCheck className="size-4.5" strokeWidth={2.25} />
            </span>
            SafeRide QR
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-center sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,theme(colors.blue.600/.35),transparent)]"
        />
        <div className="relative mx-auto max-w-2xl">
          <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur">
            👋
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
            Get in touch
          </h1>
          <p className="mx-auto mt-4 max-w-md text-slate-400 text-balance">
            Questions about activation, lost stickers, agent payouts, or anything else — we&apos;re
            happy to help.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {channels.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <span className="mx-auto text-3xl" aria-hidden>{c.emoji}</span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{c.title}</h2>
              <p className="mt-1 text-sm font-semibold text-blue-600 break-all">{c.value}</p>
              <p className="mt-1 text-xs text-slate-400">{c.desc}</p>
              <span
                className={`mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${c.chip} group-hover:brightness-95`}
              >
                <c.icon className="size-3.5" />
                {c.cta}
              </span>
            </a>
          ))}
        </div>

        {/* Support hours note */}
        <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2 rounded-2xl border border-slate-200/60 bg-slate-50/70 px-5 py-4 text-sm text-slate-500">
          <Clock className="size-4 shrink-0 text-blue-500" />
          <p>
            Support hours: <span className="font-semibold text-slate-700">Mon–Sat, 9 AM – 7 PM IST</span>.
            Emergencies via QR scan work 24×7 🛡️
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-4 py-8 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} SafeRide QR. All rights reserved. · Made with care in India 🇮🇳</p>
      </footer>
    </main>
  );
}
