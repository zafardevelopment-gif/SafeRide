import { Card, CardContent } from "@/components/ui/card";
import { Car } from "lucide-react";

export const metadata = { title: "My Vehicles" };

export default function VehiclesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Vehicles</h1>
        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
          Coming in Phase 2
        </span>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <Car className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No vehicles yet</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Vehicle registration and QR activation will be available in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
