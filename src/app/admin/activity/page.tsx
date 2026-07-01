import { getActivityData } from "@/actions/admin-activity";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, Users, CalendarDays } from "lucide-react";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Business Activity" };

export default async function AdminActivityPage() {
  const data = await getActivityData();
  const maxDayCount = Math.max(1, ...data.activationsByDay.map((d) => d.count));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Business Activity</h1>
        <p className="text-sm text-gray-500 mt-1">
          Commission liability and activation trends. Payment/revenue figures will appear here once
          checkout is live.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Commission Earned",
            value: formatINR(data.totalCommissionEarned),
            icon: <Wallet className="w-5 h-5 text-blue-500" />,
            color: "bg-blue-50",
          },
          {
            label: "Commission Paid",
            value: formatINR(data.totalCommissionPaid),
            icon: <Wallet className="w-5 h-5 text-green-500" />,
            color: "bg-green-50",
          },
          {
            label: "Pending Payout",
            value: formatINR(data.totalCommissionPending),
            icon: <Wallet className="w-5 h-5 text-amber-500" />,
            color: "bg-amber-50",
          },
          {
            label: "Activations This Month",
            value: data.activationsThisMonth,
            icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
            color: "bg-purple-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className={`border-0 ${stat.color}`}>
            <CardContent className="pt-4 pb-3">
              <div className="mb-2">{stat.icon}</div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            Activations — last 30 days
          </h2>
          {data.activationsByDay.length === 0 ? (
            <p className="text-sm text-gray-400">No activations yet.</p>
          ) : (
            <div className="space-y-1.5">
              {data.activationsByDay.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20 shrink-0">{d.date}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(d.count / maxDayCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-6 text-right shrink-0">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-400" />
            Top Agents
          </h2>
          {data.topAgents.length === 0 ? (
            <p className="text-sm text-gray-400">No agents yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topAgents.map((a) => (
                <div key={a.referralCode} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {a.name} <span className="text-gray-400 font-mono text-xs">{a.referralCode}</span>
                  </span>
                  <span className="font-medium text-gray-900">{formatINR(a.totalEarned)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data.planAdoption.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h2 className="font-bold text-gray-900 mb-3">Active Subscriptions by Plan</h2>
            <div className="space-y-2">
              {data.planAdoption.map((p) => (
                <div key={p.planName} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{p.planName}</span>
                  <span className="font-medium text-gray-900">{p.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
