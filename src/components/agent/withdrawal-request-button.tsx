"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Banknote, CheckCircle2 } from "lucide-react";
import { requestWithdrawal } from "@/actions/agent";

export default function WithdrawalRequestButton({
  initialRequestedAt,
}: {
  initialRequestedAt: string | null;
}) {
  const [requestedAt, setRequestedAt] = useState(initialRequestedAt);
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    setLoading(true);
    const result = await requestWithdrawal();
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to request withdrawal");
      return;
    }
    setRequestedAt(new Date().toISOString());
    toast.success("Withdrawal requested — admin has been notified.");
  }

  if (requestedAt) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg px-3 h-9 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-4 h-4" />
        Withdrawal requested {new Date(requestedAt).toLocaleDateString("en-IN")}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRequest}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg px-4 h-9 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      <Banknote className="w-4 h-4" />
      {loading ? "Requesting..." : "Request Withdrawal"}
    </button>
  );
}
