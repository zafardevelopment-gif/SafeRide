import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No orders yet</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Your payment history will appear here after your first activation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
