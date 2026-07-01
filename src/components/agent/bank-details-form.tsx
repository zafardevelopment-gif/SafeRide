"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Landmark, Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/shared/submit-button";
import { updateBankDetails } from "@/actions/agent";

interface BankDetailsFormProps {
  initial: {
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_ifsc: string | null;
    upi_id: string | null;
  } | null;
}

export default function BankDetailsForm({ initial }: BankDetailsFormProps) {
  const [editing, setEditing] = useState(!initial?.bank_account_number && !initial?.upi_id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bank_account_name: initial?.bank_account_name ?? "",
    bank_account_number: initial?.bank_account_number ?? "",
    bank_ifsc: initial?.bank_ifsc ?? "",
    upi_id: initial?.upi_id ?? "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateBankDetails(form);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save bank details");
      return;
    }
    setEditing(false);
    toast.success("Payout details saved");
  }

  const hasDetails = form.bank_account_number || form.upi_id;

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-gray-400" />
            Payout Details
          </h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Pencil className="w-3.5 h-3.5" />
              {hasDetails ? "Edit" : "Add"}
            </button>
          )}
        </div>

        {!editing && (
          hasDetails ? (
            <div className="text-sm text-gray-600 space-y-1">
              {form.upi_id && <p>UPI: <span className="font-medium text-gray-900">{form.upi_id}</span></p>}
              {form.bank_account_number && (
                <p>
                  Bank: {form.bank_account_name} · {form.bank_ifsc} · ****
                  {form.bank_account_number.slice(-4)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Add your UPI ID or bank details so admin knows where to send payouts.
            </p>
          )
        )}

        {editing && (
          <form onSubmit={handleSave} className="space-y-3 rounded-lg border border-border bg-gray-50/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">Payout details</p>
              {hasDetails && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                placeholder="yourname@upi"
                value={form.upi_id}
                onChange={(e) => set("upi_id", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bank_account_name">Account holder name</Label>
              <Input
                id="bank_account_name"
                value={form.bank_account_name}
                onChange={(e) => set("bank_account_name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bank_account_number">Account number</Label>
                <Input
                  id="bank_account_number"
                  value={form.bank_account_number}
                  onChange={(e) => set("bank_account_number", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank_ifsc">IFSC</Label>
                <Input
                  id="bank_ifsc"
                  value={form.bank_ifsc}
                  onChange={(e) => set("bank_ifsc", e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <SubmitButton loading={loading} className="w-full">
              Save payout details
            </SubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
