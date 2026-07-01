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

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "agent" ? agentNav : role === "admin" ? adminNav : customerNav;

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r bg-white h-full">
      {/* Logo */}
      <div className="px-4 h-14 flex items-center border-b">
        <span className="font-bold text-blue-600 text-base">SafeRide QR</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <span className={active ? "text-blue-600" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="border-t px-4 py-3">
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-900 truncate">{userName ?? "—"}</p>
          <p className="text-xs text-gray-400 truncate">{userEmail ?? ""}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
