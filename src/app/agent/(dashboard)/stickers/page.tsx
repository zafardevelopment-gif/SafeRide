import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Package } from "lucide-react";
import { getMyQRBatches } from "@/actions/agent";

export const metadata = { title: "Stickers Sold" };

export default async function AgentStickersPage() {
  const batches = await getMyQRBatches();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Stickers Sold</h1>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <BarChart3 className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No batches tagged to you yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              When an admin generates a QR batch tagged to you, it'll show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{batch.quantity} QR codes</p>
                    <p className="text-sm text-gray-500">
                      {new Date(batch.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">
                  {batch.activated_count} / {batch.quantity} activated
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
