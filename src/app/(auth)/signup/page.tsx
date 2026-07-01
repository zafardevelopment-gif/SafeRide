"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithPassword } from "@/actions/auth";
import SubmitButton from "@/components/shared/submit-button";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? undefined;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer" as "customer" | "agent",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await signUpWithPassword({ ...form, referralCode });
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to create account");
      return;
    }
    toast.success("Account created! Welcome to SafeRide QR");
    router.push(form.role === "agent" ? "/agent" : "/dashboard");
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">Protect your vehicle in minutes</p>
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
          {referralCode && (
            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Referred by code {referralCode}
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
            />
          </div>

          <SubmitButton loading={loading} className="w-full">
            Create account
          </SubmitButton>
          <p className="text-center text-sm text-gray-500">
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
