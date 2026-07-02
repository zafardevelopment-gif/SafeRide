import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "agent") redirect("/agent");
  if (user.role === "admin") redirect("/admin");

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50/80">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar role={user.role} userName={user.name} userEmail={user.email} />
      </div>

      {/* Mobile header + drawer (stacks on top on mobile) */}
      <MobileHeader role={user.role} userName={user.name} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
