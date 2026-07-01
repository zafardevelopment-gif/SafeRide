"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ScanLine } from "lucide-react";
import QrScannerModal from "@/components/shared/qr-scanner-modal";

const linkActions = [
  { label: "Add a Vehicle", href: "/dashboard/vehicles", desc: "Register a new bike, car, or scooter" },
  { label: "Add Emergency Contact", href: "/dashboard/emergency-contacts", desc: "Who should we call in an emergency?" },
  { label: "View My QR Stickers", href: "/dashboard/stickers", desc: "Check sticker status and scan history" },
  { label: "Manage Subscription", href: "/dashboard/subscription", desc: "Upgrade to Premium for WhatsApp alerts" },
];

export default function QuickActions() {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex items-center justify-between p-4 bg-white border border-border rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <ScanLine className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Scan QR Sticker</p>
              <p className="text-xs text-gray-400 mt-0.5">Activate a new sticker with your camera</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
        </button>

        {linkActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center justify-between p-4 bg-white border border-border rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{action.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
