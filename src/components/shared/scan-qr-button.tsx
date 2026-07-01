"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import QrScannerModal from "@/components/shared/qr-scanner-modal";
import { cn } from "@/lib/utils";

interface ScanQrButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function ScanQrButton({ className, children }: ScanQrButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 h-9 text-sm font-medium bg-background hover:bg-muted transition-colors",
          className
        )}
      >
        <ScanLine className="w-4 h-4" />
        {children ?? "Scan QR to Activate"}
      </button>
      <QrScannerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
