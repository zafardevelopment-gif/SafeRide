"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeSignup } from "@/actions/auth";
import SubmitButton from "@/components/shared/submit-button";

export default function CompleteSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "customer" as "customer" | "agent",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const result = await completeSignup({ name: form.name, role: form.role });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to complete signup");
      return;
    }
    toast.success("Account created! Welcome to SafeRide QR");
    router.push(form.role === "agent" ? "/agent" : "/dashboard");
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Almost there</h1>
            <p className="text-sm text-slate-500 mt-1">Tell us a bit about yourself</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "customer", label: "Vehicle Owner", emoji: "🚗", desc: "Protect my vehicle" },
                { value: "agent", label: "Agent / Reseller", emoji: "🤝", desc: "Sell & earn commission" },
              ] as const
            ).map((r) => {
              const selected = form.role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set("role", r.value)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3 text-center transition-all ${
                    selected
                      ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                >
                  <span className="text-xl" aria-hidden>{r.emoji}</span>
                  <span className={`text-sm font-semibold ${selected ? "text-blue-700" : "text-slate-700"}`}>
                    {r.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{r.desc}</span>
                </button>
              );
            })}
          </div>
          {form.role === "agent" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              💼 Agents sell QR stickers offline and earn commission per activation.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="Rajesh Kumar"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              autoFocus
            />
          </div>

          <SubmitButton
            loading={loading}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/25 hover:brightness-110"
          >
            Create account ✨
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
