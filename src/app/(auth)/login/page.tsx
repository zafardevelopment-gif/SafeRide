"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/actions/auth";
import SubmitButton from "@/components/shared/submit-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const result = await signInWithPassword(email, password);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Login failed");
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
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Log in to your account</p>
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
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <SubmitButton loading={loading} className="w-full">
            Log in
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
