"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { reportLostOrDamaged } from "@/actions/vehicle";

export default function ReportLostButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("Report this sticker as lost or damaged? It will be suspended immediately.")) return;
    setLoading(true);
    const result = await reportLostOrDamaged(vehicleId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update sticker status");
      return;
    }
    toast.success("Sticker marked as lost. Contact support for a replacement.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      Report lost / damaged
    </button>
  );
}
