"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { createQRBatch } from "@/actions/qr-batch";

interface GenerateBatchFormProps {
  agents: { id: string; name: string; referral_code: string }[];
}

export default function GenerateBatchForm({ agents }: GenerateBatchFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState("50");
  const [agentId, setAgentId] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createQRBatch({
      quantity: Number(quantity),
      agentId: agentId || undefined,
      notes: notes || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to generate batch");
      return;
    }
    toast.success(`${quantity} QR codes generated`);
    router.push(`/admin/qr-batches/${result.data!.batchId}`);
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-semibold text-blue-700">Generate a new batch</p>
        </div>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={5000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent">Tag to agent (optional)</Label>
            <select
              id="agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              <option value="">No agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.referral_code})
                </option>
              ))}
            </select>
          </div>
          <SubmitButton loading={loading}>Generate</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
