import { QRCodeSVG } from "qrcode.react";
import { Lock, ParkingSquare, Lightbulb, Truck, TriangleAlert, ShieldCheck } from "lucide-react";
import type { QRCode } from "@/types";

interface StickerStripProps {
  code: QRCode;
  appUrl: string;
}

export default function StickerStrip({ code, appUrl }: StickerStripProps) {
  const domain = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="w-full aspect-[2/1] rounded-xl border-2 border-gray-900 bg-white overflow-hidden flex print:break-inside-avoid">
      {/* QR block */}
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col items-center justify-center gap-1.5 px-4 py-3 shrink-0 overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-6 -bottom-6 size-24 rounded-full bg-red-600/20"
        />
        <div className="relative rounded-lg bg-white p-1.5 ring-2 ring-yellow-400/80">
          <QRCodeSVG
            value={`${appUrl}/scan/${code.qr_id}`}
            size={92}
            level="H"
            imageSettings={{
              src: "/icons/qr-logo.svg",
              height: 20,
              width: 20,
              excavate: true,
            }}
          />
        </div>
        <span className="relative inline-flex items-center gap-1.5 text-yellow-400 text-[11px] font-extrabold tracking-wide">
          <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          SafeRide QR
        </span>
        <span className="relative text-[8px] font-bold tracking-wide text-gray-300">🌐 {domain}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 gap-1.5 min-w-0 bg-gradient-to-br from-red-50/70 via-white to-white">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 w-fit">
          <Lock className="w-2.5 h-2.5" strokeWidth={2.5} />
          PHONE NUMBER HIDDEN
        </span>
        <div className="rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5">
          <p className="text-base font-extrabold text-gray-900 leading-tight">
            SCAN TO CONTACT THE <span className="text-red-600">OWNER</span>
          </p>
          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">वाहन मालिक से संपर्क करें</p>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mt-1">
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-gray-100 py-1.5">
            <ParkingSquare className="w-3.5 h-3.5 text-gray-900" strokeWidth={2.25} />
            <span className="text-[7px] font-bold text-gray-800 uppercase text-center leading-none">
              Wrong
              <br />
              Parking
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-gray-100 py-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-gray-900" strokeWidth={2.25} />
            <span className="text-[7px] font-bold text-gray-800 uppercase text-center leading-none">
              Lights
              <br />
              On
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-gray-100 py-1.5">
            <Truck className="w-3.5 h-3.5 text-gray-900" strokeWidth={2.25} />
            <span className="text-[7px] font-bold text-gray-800 uppercase text-center leading-none">Towing</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-red-50 py-1.5">
            <TriangleAlert className="w-3.5 h-3.5 text-red-700" strokeWidth={2.25} />
            <span className="text-[7px] font-bold text-red-700 uppercase text-center leading-none">Emergency</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-[9px] text-gray-400 font-mono">SRQ-{code.qr_id}</p>
          <p className="text-[9px] font-extrabold tracking-wide text-gray-700">{domain}</p>
        </div>
      </div>
    </div>
  );
}
