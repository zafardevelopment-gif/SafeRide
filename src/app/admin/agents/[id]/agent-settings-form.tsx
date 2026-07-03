"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import {
  setAgentCommissionAmount,
  setAgentActivationFeeAmount,
  updateAgentBankDetails,
} from "@/actions/admin-agents";

interface AgentSettingsFormProps {
  agentId: string;
  commissionAmountPaise: number | null;
  activationFeePaise: number | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  upiId: string | null;
}

export default function AgentSettingsForm({
  agentId,
  commissionAmountPaise,
  activationFeePaise,
  bankAccountName,
  bankAccountNumber,
  bankIfsc,
  upiId,
}: AgentSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [commissionRupees, setCommissionRupees] = useState(
    commissionAmountPaise != null ? String(commissionAmountPaise / 100) : ""
  );
  const [priceRupees, setPriceRupees] = useState(
    activationFeePaise != null ? String(activationFeePaise / 100) : ""
  );
  const [accountName, setAccountName] = useState(bankAccountName ?? "");
  const [accountNumber, setAccountNumber] = useState(bankAccountNumber ?? "");
  const [ifsc, setIfsc] = useState(bankIfsc ?? "");
  const [upi, setUpi] = useState(upiId ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const commissionResult = await setAgentCommissionAmount(
      agentId,
      commissionRupees.trim() ? Math.round(Number(commissionRupees) * 100) : null
    );
    if (!commissionResult.success) {
      setLoading(false);
      toast.error(commissionResult.error ?? "Failed to update commission");
      return;
    }

    const priceResult = await setAgentActivationFeeAmount(
      agentId,
      priceRupees.trim() ? Math.round(Number(priceRupees) * 100) : null
    );
    if (!priceResult.success) {
      setLoading(false);
      toast.error(priceResult.error ?? "Failed to update price");
      return;
    }

    const bankResult = await updateAgentBankDetails(agentId, {
      bank_account_name: accountName.trim(),
      bank_account_number: accountNumber.trim(),
      bank_ifsc: ifsc.trim(),
      upi_id: upi.trim(),
    });
    setLoading(false);

    if (!bankResult.success) {
      toast.error(bankResult.error ?? "Failed to update account details");
      return;
    }
    toast.success("Agent settings updated");
  }

  return (
    <Card>
      <CardContent className="py-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-gray-400" />
          Payout &amp; Commission Settings
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="commission">Commission per activation (₹)</Label>
              <Input
                id="commission"
                type="number"
                min={0}
                step="1"
                placeholder="Use default"
                value={commissionRupees}
                onChange={(e) => setCommissionRupees(e.target.value)}
              />
              <p className="text-xs text-gray-400">Blank = global default rate.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price this agent charges (₹)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="1"
                placeholder="Use default"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
              />
              <p className="text-xs text-gray-400">Blank = global sticker price.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="account_name">Account holder name</Label>
              <Input id="account_name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input id="upi_id" placeholder="name@upi" value={upi} onChange={(e) => setUpi(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="account_number">Bank account number</Label>
              <Input
                id="account_number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ifsc">IFSC code</Label>
              <Input id="ifsc" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
            </div>
          </div>

          <SubmitButton loading={loading}>Save</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
