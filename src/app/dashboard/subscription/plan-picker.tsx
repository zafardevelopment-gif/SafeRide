"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CheckoutButton from "@/components/subscription/checkout-button";
import { validateCoupon } from "@/actions/coupons";
import { formatINR } from "@/lib/utils";
import type { Plan } from "@/types";

interface PlanPickerProps {
  plans: Plan[];
  currentPlanId: string | null;
  customerName: string | null;
  customerEmail: string | null;
}

const featureLabels: { key: keyof Plan["features"]; label: string }[] = [
  { key: "sms_alerts", label: "SMS alerts" },
  { key: "whatsapp_alerts", label: "WhatsApp alerts" },
  { key: "email_alerts", label: "Email alerts" },
  { key: "medical_profile", label: "Medical profile" },
  { key: "priority_support", label: "Priority support" },
];

export default function PlanPicker({ plans, currentPlanId, customerName, customerEmail }: PlanPickerProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number; planId: string } | null>(
    null
  );
  const [validating, setValidating] = useState(false);

  async function handleApplyCoupon(plan: Plan) {
    if (!couponInput.trim()) return;
    setValidating(true);
    const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    const result = await validateCoupon(couponInput, plan.id, price);
    setValidating(false);
    if (!result.success) {
      toast.error(result.error ?? "Invalid coupon");
      return;
    }
    setAppliedCoupon({ code: result.data!.coupon.code, discountPaise: result.data!.discountPaise, planId: plan.id });
    toast.success(`Coupon applied: -${formatINR(result.data!.discountPaise)}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border p-1 bg-white">
          {(["monthly", "yearly"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                billingCycle === cycle ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {cycle}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
          const isPaid = price > 0;
          const isCurrent = plan.id === currentPlanId;
          const couponForThisPlan = appliedCoupon?.planId === plan.id ? appliedCoupon : undefined;
          const finalPrice = couponForThisPlan ? Math.max(0, price - couponForThisPlan.discountPaise) : price;

          return (
            <Card key={plan.id} className={isCurrent ? "border-blue-300" : undefined}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  {isCurrent && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Current plan
                    </Badge>
                  )}
                </div>

                <div className="mb-4">
                  {couponForThisPlan && couponForThisPlan.discountPaise > 0 && (
                    <p className="text-xs text-gray-400 line-through">{formatINR(price)}</p>
                  )}
                  <p className="text-2xl font-extrabold text-gray-900">
                    {isPaid ? formatINR(finalPrice) : "Free"}
                    {isPaid && (
                      <span className="text-sm font-normal text-gray-400">
                        /{billingCycle === "yearly" ? "yr" : "mo"}
                      </span>
                    )}
                  </p>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {featureLabels
                    .filter((f) => plan.features[f.key])
                    .map((f) => (
                      <li key={f.key} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {f.label}
                      </li>
                    ))}
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    Up to {plan.features.max_vehicles} vehicle{plan.features.max_vehicles > 1 ? "s" : ""}
                  </li>
                </ul>

                {isPaid && !isCurrent && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponForThisPlan ? couponForThisPlan.code : couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        disabled={!!couponForThisPlan}
                      />
                      {!couponForThisPlan && (
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon(plan)}
                          disabled={validating || !couponInput.trim()}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 rounded-lg border border-border bg-white hover:bg-gray-50 disabled:opacity-50 shrink-0"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          Apply
                        </button>
                      )}
                    </div>
                    <CheckoutButton
                      planId={plan.id}
                      planName={plan.name}
                      billingCycle={billingCycle}
                      couponCode={couponForThisPlan?.code}
                      customerName={customerName}
                      customerEmail={customerEmail}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
