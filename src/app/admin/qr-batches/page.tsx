import { getQRBatches, getAgentsForSelect } from "@/actions/qr-batch";
import GenerateBatchForm from "./generate-batch-form";
import BatchesList from "./batches-list";
import QrSearch from "./qr-search";

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

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
          🔍 Find a QR Code
        </h2>
        <QrSearch />
      </div>

      <BatchesList batches={batches} />
    </div>
  );
}
