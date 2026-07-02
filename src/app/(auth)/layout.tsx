import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      {/* Ambient gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,theme(colors.blue.100),transparent),radial-gradient(ellipse_40%_30%_at_85%_90%,theme(colors.cyan.100/.7),transparent)]"
      />

      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-500 hover:bg-white hover:text-slate-900 transition-colors sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      <div className="relative mb-8 flex flex-col items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
          <ShieldCheck className="size-6" strokeWidth={2} />
        </span>
        <span className="mt-3 text-xl font-bold tracking-tight text-slate-900">SafeRide QR</span>
        <p className="mt-1 text-sm text-slate-500">Smart Vehicle Protection</p>
      </div>

      <div className="relative w-full max-w-sm [&>*]:shadow-xl [&>*]:shadow-slate-900/5 [&>*]:border-slate-200/80">
        {children}
      </div>

      <p className="relative mt-8 text-xs text-slate-400">
        © {new Date().getFullYear()} SafeRide QR · Made for India
      </p>
    </div>
  );
}
