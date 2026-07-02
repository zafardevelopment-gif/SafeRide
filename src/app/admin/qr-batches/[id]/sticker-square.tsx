import { QRCodeSVG } from "qrcode.react";
import { Lock, ParkingSquare, Lightbulb, Truck, TriangleAlert, ShieldCheck } from "lucide-react";
import type { QRCode } from "@/types";

interface StickerSquareProps {
  code: QRCode;
  appUrl: string;
}

export default function StickerSquare({ code, appUrl }: StickerSquareProps) {
  return (
    <div className="w-full rounded-2xl border-2 border-gray-900 bg-white overflow-hidden flex flex-col print:break-inside-avoid">
      {/* Header — Alert Red */}
      <div className="bg-red-600 text-white px-4 pt-3 pb-3">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide bg-white/15 rounded-full px-2.5 py-0.5 mb-1.5 w-fit">
          <Lock className="w-3 h-3" />
          NUMBER 100% HIDDEN
        </span>
        <p className="text-base font-extrabold leading-tight">
          SCAN TO CONTACT
          <br />
          THE <span className="text-yellow-300">VEHICLE OWNER</span>
        </p>
        <p className="text-[11px] text-red-100 mt-1">वाहन मालिक से संपर्क करें — नंबर पूरी तरह सुरक्षित</p>
      </div>

      {/* QR + instructions side-by-side */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="rounded-lg border-2 border-gray-900 p-2 bg-white shrink-0">
          <QRCodeSVG value={`${appUrl}/scan/${code.qr_id}`} size={100} />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shrink-0">
              1
            </span>
            <p className="text-[11px] text-gray-700 leading-tight">
              <span className="font-semibold">Open phone camera</span>
              <br />
              <span className="text-gray-500">फोन कैमरा से स्कैन करें</span>
            </p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shrink-0">
              2
            </span>
            <p className="text-[11px] text-gray-700 leading-tight">
              <span className="font-semibold">Pick reason, alert owner</span>
              <br />
              <span className="text-gray-500">कारण चुनें</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4-icon action row */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-gray-100 py-2">
          <ParkingSquare className="w-5 h-5 text-gray-900" strokeWidth={2.25} />
          <span className="text-[8px] font-bold text-gray-800 uppercase text-center leading-tight">
            Wrong
            <br />
            Parking
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-gray-100 py-2">
          <Lightbulb className="w-5 h-5 text-gray-900" strokeWidth={2.25} />
          <span className="text-[8px] font-bold text-gray-800 uppercase text-center leading-tight">
            Lights
            <br />
            On
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-gray-100 py-2">
          <Truck className="w-5 h-5 text-gray-900" strokeWidth={2.25} />
          <span className="text-[8px] font-bold text-gray-800 uppercase text-center leading-tight">Towing</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-red-50 py-2">
          <TriangleAlert className="w-5 h-5 text-red-700" strokeWidth={2.25} />
          <span className="text-[8px] font-bold text-red-700 uppercase text-center leading-tight">Emergency</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto bg-yellow-400 text-gray-900 px-4 py-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold">
          <ShieldCheck className="w-4 h-4" strokeWidth={2.25} />
          SafeRide QR
        </span>
        <span className="text-[11px] font-mono font-semibold">SRQ-{code.qr_id}</span>
      </div>
    </div>
  );
}
