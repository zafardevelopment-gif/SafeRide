import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { getQRBatches, getAgentsForSelect } from "@/actions/qr-batch";
import GenerateBatchForm from "./generate-batch-form";
import BatchRow from "./batch-row";

export const metadata = { title: "QR Batches" };

export default async function QRBatchesPage() {
  const [batches, agents] = await Promise.all([getQRBatches(), getAgentsForSelect()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">QR Batches</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate blank QR stickers, optionally tagged to an agent for commission tracking.
        </p>
      </div>

      <GenerateBatchForm agents={agents} />

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Package className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No batches generated yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {batches.map((batch) => (
            <BatchRow key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
}
