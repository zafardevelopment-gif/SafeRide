"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ScanLine } from "lucide-react";
import QrScannerModal from "@/components/shared/qr-scanner-modal";

const linkActions = [
  { label: "Add a Vehicle", emoji: "🚗", href: "/dashboard/vehicles", desc: "Register a new bike, car, or scooter" },
  { label: "Add Emergency Contact", emoji: "📞", href: "/dashboard/emergency-contacts", desc: "Who should we call in an emergency?" },
  { label: "View My QR Stickers", emoji: "🔳", href: "/dashboard/stickers", desc: "Check sticker status and scan history" },
  { label: "Manage Subscription", emoji: "⭐", href: "/dashboard/subscription", desc: "Upgrade to Premium for WhatsApp alerts" },
];

export default function QuickActions() {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        ⚡ Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-900/5 group"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
              📷
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                Scan QR Sticker
                <ScanLine className="w-3.5 h-3.5 text-blue-500" />
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Activate a new sticker with your camera</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {linkActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-900/5 group"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg group-hover:bg-blue-50 transition-colors">
                {action.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
