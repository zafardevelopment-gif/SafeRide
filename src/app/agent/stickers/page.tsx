import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "Stickers Sold" };

export default function AgentStickersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Stickers Sold</h1>
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
          Coming in Phase 5
        </span>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <BarChart3 className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No sticker data yet</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Full batch tracking and per-sticker activation status will be shown here in Phase 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
