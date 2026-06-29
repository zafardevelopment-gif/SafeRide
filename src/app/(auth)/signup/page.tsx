"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOTP, verifyOTP, completeSignup } from "@/actions/auth";
import OTPInput from "@/components/auth/otp-input";
import SubmitButton from "@/components/shared/submit-button";

type Step = "details" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer" as "customer" | "agent",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    const result = await sendOTP(form.email);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to send OTP");
      return;
    }
    toast.success("OTP sent to your email");
    setStep("otp");
  }

  async function handleVerifyOTP(token: string) {
    setLoading(true);
    const otpResult = await verifyOTP(form.email, token);
    if (!otpResult.success) {
      setLoading(false);
      toast.error(otpResult.error ?? "Invalid OTP");
      return;
    }
    // OTP verified — now save name, phone, role
    const profileResult = await completeSignup({
      name: form.name,
      phone: form.phone,
      role: form.role,
    });
    setLoading(false);
    if (!profileResult.success) {
      toast.error(profileResult.error ?? "Failed to save profile");
      return;
    }
    toast.success("Account created! Welcome to SafeRide QR");
    router.push(form.role === "agent" ? "/agent" : "/dashboard");
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        {step === "details" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900">Create account</h1>
              <p className="text-sm text-gray-500 mt-1">
                Protect your vehicle in minutes
              </p>
            </div>

            {/* Role toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["customer", "agent"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("role", r)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.role === r
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {r === "customer" ? "Vehicle Owner" : "Agent / Reseller"}
                </button>
              ))}
            </div>
            {form.role === "agent" && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Agents sell QR stickers offline and earn commission per activation.
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
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-lg bg-muted text-sm text-gray-500">
                  +91
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                  required
                  className="rounded-l-none"
                />
              </div>
            </div>

            <SubmitButton loading={loading} className="w-full">
              Continue
            </SubmitButton>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Log in
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900">Verify your email</h1>
              <p className="text-sm text-gray-500 mt-1">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-gray-700">{form.email}</span>
              </p>
            </div>
            <OTPInput onComplete={handleVerifyOTP} loading={loading} />
            <button
              type="button"
              onClick={() => setStep("details")}
              className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              ← Go back
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
