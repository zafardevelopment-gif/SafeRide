import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "customer") redirect("/dashboard");
  if (user.role === "admin") redirect("/admin");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/80">
      <div className="hidden lg:flex">
        <Sidebar role={user.role} userName={user.name} userEmail={user.email} />
      </div>
      <MobileHeader role={user.role} userName={user.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
