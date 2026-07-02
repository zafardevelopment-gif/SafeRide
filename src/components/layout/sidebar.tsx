"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Car,
  QrCode,
  Phone,
  CreditCard,
  ShoppingBag,
  LayoutDashboard,
  Link2,
  BarChart3,
  Wallet,
  History,
  LogOut,
  Package,
  Users,
  Ticket,
  ShieldAlert,
  Activity,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "@/actions/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Vehicles", href: "/dashboard/vehicles", icon: <Car className="w-4 h-4" /> },
  { label: "My QR Stickers", href: "/dashboard/stickers", icon: <QrCode className="w-4 h-4" /> },
  { label: "Emergency Contacts", href: "/dashboard/emergency-contacts", icon: <Phone className="w-4 h-4" /> },
  { label: "Subscription", href: "/dashboard/subscription", icon: <CreditCard className="w-4 h-4" /> },
  { label: "Orders", href: "/dashboard/orders", icon: <ShoppingBag className="w-4 h-4" /> },
];

const agentNav: NavItem[] = [
  { label: "Dashboard", href: "/agent", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Referral Link", href: "/agent/referral", icon: <Link2 className="w-4 h-4" /> },
  { label: "Stickers Sold", href: "/agent/stickers", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Commission Earned", href: "/agent/commissions", icon: <Wallet className="w-4 h-4" /> },
  { label: "Payout History", href: "/agent/payouts", icon: <History className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "QR Batches", href: "/admin/qr-batches", icon: <Package className="w-4 h-4" /> },
  { label: "Agents", href: "/admin/agents", icon: <Users className="w-4 h-4" /> },
  { label: "Commissions", href: "/admin/commissions", icon: <Wallet className="w-4 h-4" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
  { label: "Coupons", href: "/admin/coupons", icon: <Ticket className="w-4 h-4" /> },
  { label: "Payments", href: "/admin/payments", icon: <CreditCard className="w-4 h-4" /> },
  { label: "Scans", href: "/admin/scans", icon: <ShieldAlert className="w-4 h-4" /> },
  { label: "Activity", href: "/admin/activity", icon: <Activity className="w-4 h-4" /> },
  { label: "Audit Log", href: "/admin/audit-log", icon: <ScrollText className="w-4 h-4" /> },
];

interface SidebarProps {
  role: "customer" | "agent" | "admin" | "support";
  userName: string | null;
  userEmail: string | null;
}

const roleLabel: Record<SidebarProps["role"], string> = {
  customer: "Rider account",
  agent: "Agent portal",
  admin: "Admin console",
  support: "Support desk",
};

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "agent" ? agentNav : role === "admin" ? adminNav : customerNav;
  const initials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-slate-200/80 bg-white h-full">
      {/* Logo */}
      <div className="px-4 h-16 flex items-center gap-2.5 border-b border-slate-100">
        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/20">
          <ShieldCheck className="size-4.5" strokeWidth={2.25} />
        </span>
        <div className="leading-tight">
          <p className="font-bold text-slate-900 text-sm tracking-tight">SafeRide QR</p>
          <p className="text-[11px] text-slate-400">{roleLabel[role]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/agent" && item.href !== "/admin" &&
              pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
              )}
              <span className={active ? "text-blue-600" : "text-slate-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="border-t border-slate-100 px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{userName ?? "—"}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail ?? ""}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
