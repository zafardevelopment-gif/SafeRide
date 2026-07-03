"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { setActivationFeeAmount } from "@/actions/settings";

export default function ActivationFeeForm({ currentAmountPaise }: { currentAmountPaise: number }) {
  const [loading, setLoading] = useState(false);
  const [rupees, setRupees] = useState(String(currentAmountPaise / 100));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await setActivationFeeAmount(Math.round(Number(rupees) * 100));
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update price");
      return;
    }
    toast.success("Sticker price updated");
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-700">Sticker activation price</p>
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1 max-w-[160px]">
            <Label htmlFor="activation_fee">Amount (₹)</Label>
            <Input
              id="activation_fee"
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
          Charged on new online/UPI checkouts (before GST). Individual agents can be given their
          own cash-sale price on their agent detail page.
        </p>
      </CardContent>
    </Card>
  );
}
