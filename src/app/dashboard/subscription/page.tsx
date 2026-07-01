import { CreditCard } from "lucide-react";
import { getActivePlans, getMySubscription } from "@/actions/plans";
import { getCurrentUser } from "@/actions/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import PlanPicker from "./plan-picker";

export const metadata = { title: "Subscription" };

export default async function SubscriptionPage() {
  const [plans, subscription, user] = await Promise.all([
    getActivePlans(),
    getMySubscription(),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Subscription</h1>

      {subscription ? (
        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">{subscription.plan.name} plan</p>
                <p className="text-xs text-gray-500">
                  Renews {new Date(subscription.current_period_end!).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 flex flex-col items-center text-center gap-2">
            <CreditCard className="w-8 h-8 text-gray-300" />
            <p className="font-medium text-gray-500">No paid subscription</p>
            <p className="text-sm text-gray-400 max-w-xs">
              You're on the free Basic plan. Upgrade below for WhatsApp alerts, medical profiles, and
              priority support.
            </p>
          </CardContent>
        </Card>
      )}

      <PlanPicker
        plans={plans}
        currentPlanId={subscription?.plan.id ?? null}
        customerName={user?.name ?? null}
        customerEmail={user?.email ?? null}
      />
    </div>
  );
}
