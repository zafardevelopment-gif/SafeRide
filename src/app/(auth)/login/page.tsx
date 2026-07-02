"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOTP, verifyOTP } from "@/actions/auth";
import SubmitButton from "@/components/shared/submit-button";
import GoogleButton from "@/components/shared/google-button";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (result.data?.isNewUser) {
      // Someone tried to "log in" with an email that has no account yet.
      router.push("/signup");
      return;
    }
    const role = result.data?.role;
    if (role === "agent") router.push("/agent");
    else if (role === "admin") router.push("/admin");
    else router.push("/dashboard");
  }

  if (step === "otp") {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center mb-4">
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
              Verify & log in
            </SubmitButton>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-center text-sm text-slate-500 hover:underline"
            >
              Use a different email
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Welcome back 👋</h1>
            <p className="text-sm text-slate-500 mt-1">Log in to your account</p>
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
          <p className="text-center text-sm text-gray-500">
            New here?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
