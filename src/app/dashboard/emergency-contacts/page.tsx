import { Card, CardContent } from "@/components/ui/card";
import { Phone } from "lucide-react";

export const metadata = { title: "Emergency Contacts" };

export default function EmergencyContactsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Emergency Contacts</h1>
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
          Coming in Phase 2
        </span>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <Phone className="w-10 h-10 text-gray-300" />
          <p className="font-medium text-gray-500">No emergency contacts added</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Add contacts during vehicle activation in Phase 2. They'll be notified if someone triggers Emergency mode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
