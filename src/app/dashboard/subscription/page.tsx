import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export const metadata = { title: "Subscription" };

export default function SubscriptionPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <CreditCard className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No active subscription</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Subscription plans and Razorpay integration are coming in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
