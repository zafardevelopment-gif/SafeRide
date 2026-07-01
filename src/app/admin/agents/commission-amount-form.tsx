"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { setCommissionAmount } from "@/actions/settings";

export default function CommissionAmountForm({ currentAmountPaise }: { currentAmountPaise: number }) {
  const [loading, setLoading] = useState(false);
  const [rupees, setRupees] = useState(String(currentAmountPaise / 100));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await setCommissionAmount(Math.round(Number(rupees) * 100));
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update amount");
      return;
    }
    toast.success("Commission amount updated");
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-semibold text-blue-700">Commission per activation</p>
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1 max-w-[160px]">
            <Label htmlFor="commission_amount">Amount (₹)</Label>
            <Input
              id="commission_amount"
              type="number"
              min={0}
              step="1"
              value={rupees}
              onChange={(e) => setRupees(e.target.value)}
              required
            />
          </div>
          <SubmitButton loading={loading}>Update</SubmitButton>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          Applied to every new commission created when a tagged QR is activated.
        </p>
      </CardContent>
    </Card>
  );
}
