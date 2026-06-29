import { Card, CardContent } from "@/components/ui/card";
import { QrCode } from "lucide-react";

export const metadata = { title: "My QR Stickers" };

export default function StickersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My QR Stickers</h1>
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
          Coming in Phase 2
        </span>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <QrCode className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No QR stickers linked yet</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Scan a sticker or activate one from the vehicle page in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
