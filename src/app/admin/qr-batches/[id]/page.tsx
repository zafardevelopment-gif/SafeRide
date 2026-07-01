import { notFound } from "next/navigation";
import { getQRBatch, getAgentsForSelect } from "@/actions/qr-batch";
import BatchPrintSheet from "./print-sheet";
import CodeAgentList from "./code-agent-list";

export const metadata = { title: "QR Batch" };

export default async function QRBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, agents] = await Promise.all([getQRBatch(id), getAgentsForSelect()]);
  if (!result) notFound();

  return (
    <div className="space-y-4">
      <BatchPrintSheet batch={result.batch} codes={result.codes} />
      <CodeAgentList codes={result.codes} agents={agents} />
    </div>
  );
}
