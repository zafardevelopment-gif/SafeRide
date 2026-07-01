"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Car, QrCode, Phone, CreditCard, ShoppingBag, LayoutDashboard, Link2, BarChart3, Wallet, History, Package, Users, Ticket, ShieldAlert, Activity, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";

const customerNav = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Vehicles", href: "/dashboard/vehicles", icon: <Car className="w-4 h-4" /> },
  { label: "My QR Stickers", href: "/dashboard/stickers", icon: <QrCode className="w-4 h-4" /> },
  { label: "Emergency Contacts", href: "/dashboard/emergency-contacts", icon: <Phone className="w-4 h-4" /> },
  { label: "Subscription", href: "/dashboard/subscription", icon: <CreditCard className="w-4 h-4" /> },
  { label: "Orders", href: "/dashboard/orders", icon: <ShoppingBag className="w-4 h-4" /> },
];

const agentNav = [
  { label: "Dashboard", href: "/agent", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Referral Link", href: "/agent/referral", icon: <Link2 className="w-4 h-4" /> },
  { label: "Stickers Sold", href: "/agent/stickers", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Commission Earned", href: "/agent/commissions", icon: <Wallet className="w-4 h-4" /> },
  { label: "Payout History", href: "/agent/payouts", icon: <History className="w-4 h-4" /> },
];

const adminNav = [
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

interface MobileHeaderProps {
  role: "customer" | "agent" | "admin" | "support";
  userName: string | null;
}

export default function MobileHeader({ role, userName }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navItems = role === "agent" ? agentNav : role === "admin" ? adminNav : customerNav;

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 border-b bg-white flex items-center justify-between px-4 h-14">
        <span className="font-bold text-blue-600">SafeRide QR</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-xl">
            <div className="px-4 h-14 flex items-center justify-between border-b">
              <span className="font-bold text-blue-600">SafeRide QR</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span className={active ? "text-blue-600" : "text-gray-400"}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t px-4 py-3">
              <p className="text-sm font-medium text-gray-700 mb-2">{userName ?? "—"}</p>
              <form action={signOut}>
                <button type="submit" className="text-sm text-red-500 hover:text-red-700">
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
