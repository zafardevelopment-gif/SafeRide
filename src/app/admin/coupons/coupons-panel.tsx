"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Ticket, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SubmitButton from "@/components/shared/submit-button";
import { createCoupon, toggleCouponActive } from "@/actions/admin-coupons";
import type { Coupon } from "@/types";

export default function CouponsPanel({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    max_uses: "",
    valid_until: "",
  });

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createCoupon({
      code: form.code,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : undefined,
      valid_until: form.valid_until || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to create coupon");
      return;
    }
    setCoupons((prev) => [result.data!, ...prev]);
    setForm({ code: "", discount_type: "percentage", discount_value: "", max_uses: "", valid_until: "" });
    toast.success("Coupon created");
  }

  async function handleToggle(id: string, isActive: boolean) {
    const result = await toggleCouponActive(id, isActive);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update coupon");
      return;
    }
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: isActive } : c)));
    toast.success(isActive ? "Coupon activated" : "Coupon deactivated");
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold text-blue-700">Create coupon</p>
          </div>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="WELCOME10"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_type">Type</Label>
              <select
                id="discount_type"
                value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value as "percentage" | "fixed")}
                className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount_value">
                Value {form.discount_type === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                min={1}
                max={form.discount_type === "percentage" ? 100 : undefined}
                value={form.discount_value}
                onChange={(e) => set("discount_value", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_uses">Max uses (optional)</Label>
              <Input
                id="max_uses"
                type="number"
                min={1}
                value={form.max_uses}
                onChange={(e) => set("max_uses", e.target.value)}
              />
            </div>
            <SubmitButton loading={loading}>Create</SubmitButton>
          </form>
        </CardContent>
      </Card>

      {coupons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <Ticket className="w-10 h-10 text-gray-300" />
            <p className="font-medium text-gray-500">No coupons yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {coupons.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-gray-900">{c.code}</p>
                  <p className="text-sm text-gray-500">
                    {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value / 100} off`}
                    {" · "}
                    {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ""} used
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={c.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}
                  >
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleToggle(c.id, !c.is_active)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {c.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
