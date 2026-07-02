"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOTP, verifyOTP, completeSignup } from "@/actions/auth";
import SubmitButton from "@/components/shared/submit-button";
import GoogleButton from "@/components/shared/google-button";

type Step = "details" | "otp" | "profile";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? undefined;

  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "customer" as "customer" | "agent",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const result = await sendOTP(email);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to send OTP");
      return;
    }
    toast.success("OTP sent to your email");
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    const result = await verifyOTP(email, otp);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Invalid OTP");
      return;
    }
    if (!result.data?.isNewUser) {
      // Existing account — nothing more to complete.
      const role = result.data?.role;
      toast.success("Welcome back!");
      router.push(role === "agent" ? "/agent" : role === "admin" ? "/admin" : "/dashboard");
      return;
    }
    setStep("profile");
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const result = await completeSignup({ name: form.name, role: form.role });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to create account");
      return;
    }
    toast.success("Account created! Welcome to SafeRide QR");
    router.push(form.role === "agent" ? "/agent" : "/dashboard");
  }

  if (step === "otp") {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Enter OTP</h1>
              <p className="text-sm text-slate-500 mt-1">
                We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
              />
            </div>
            <SubmitButton
              loading={loading}
              className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/25 hover:brightness-110"
            >
              Verify & continue
            </SubmitButton>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="w-full text-center text-sm text-slate-500 hover:underline"
            >
              Use a different email
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "profile") {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleCompleteProfile} className="space-y-4">
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
            {referralCode && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                🎁 Referred by code {referralCode}
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

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Create account</h1>
            <p className="text-sm text-slate-500 mt-1">Protect your vehicle in minutes 🚀</p>
          </div>

          <GoogleButton disabled={loading} label="Continue with Google" />

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            or
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <SubmitButton
            loading={loading}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/25 hover:brightness-110"
          >
            Send OTP
          </SubmitButton>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
