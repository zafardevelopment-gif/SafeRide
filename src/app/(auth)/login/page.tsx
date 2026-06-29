"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOTP, verifyOTP } from "@/actions/auth";
import OTPInput from "@/components/auth/otp-input";
import SubmitButton from "@/components/shared/submit-button";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
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

  async function handleVerifyOTP(token: string) {
    setLoading(true);
    const result = await verifyOTP(email, token);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Invalid OTP");
      return;
    }
    const role = result.data?.role;
    if (role === "agent") router.push("/agent");
    else if (role === "admin") router.push("/admin");
    else router.push("/dashboard");
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        {step === "email" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email to receive a one-time login code
              </p>
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
            <SubmitButton loading={loading} className="w-full">
              Send OTP
            </SubmitButton>
            <p className="text-center text-sm text-gray-500">
              New here?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900">Enter OTP</h1>
              <p className="text-sm text-gray-500 mt-1">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-gray-700">{email}</span>
              </p>
            </div>
            <OTPInput onComplete={handleVerifyOTP} loading={loading} />
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              ← Use a different email
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
