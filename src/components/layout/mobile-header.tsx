"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Car, QrCode, Phone, CreditCard, ShoppingBag, LayoutDashboard, Link2, BarChart3, Wallet, History, Package, Users, Ticket, ShieldAlert, Activity, ScrollText, ShieldCheck, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";

const customerNav = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Notifications", href: "/dashboard/notifications", icon: <Bell className="w-4 h-4" /> },
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
      <header className="lg:hidden sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md flex items-center justify-between px-4 h-14">
        <span className="flex items-center gap-2 font-bold text-slate-900 text-sm tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <ShieldCheck className="size-4" strokeWidth={2.25} />
          </span>
          SafeRide QR
        </span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex size-9 items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="px-4 h-14 flex items-center justify-between border-b border-slate-100">
              <span className="flex items-center gap-2 font-bold text-slate-900 text-sm tracking-tight">
                <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                  <ShieldCheck className="size-4" strokeWidth={2.25} />
                </span>
                SafeRide QR
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                      active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                    )}
                    <span className={active ? "text-blue-600" : "text-slate-400"}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900 mb-2 truncate">{userName ?? "—"}</p>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
