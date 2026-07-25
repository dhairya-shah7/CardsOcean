"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ClipboardList, ShoppingCart, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { getMe } from "@/lib/api";

export function MobileNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    getMe().then((u) => {
      if (!cancelled) setUser(u);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visibleItems = useMemo(() => {
    const items = [
      { href: "/", label: "Home", icon: Home },
      { href: "/products", label: "Products", icon: Compass },
      { href: "/orders", label: "Orders", icon: ClipboardList },
      { href: "/cart", label: "Cart", icon: ShoppingCart }
    ];
    const adminEmails = ["rugs1007@gmail.com", "dhairyaqwerty1@gmail.com"];
    const isAdmin = user && (user.role === "ADMIN" || adminEmails.includes(user.email?.toLowerCase().trim()));
    if (isAdmin) {
      items.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
    }
    return items;
  }, [user]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl xl:hidden"
      aria-label="Mobile navigation"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors w-16 min-h-[52px]",
              isActive
                ? "text-royal-600 font-semibold"
                : "text-slate-500 hover:text-royal-500"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-xl transition-colors",
                isActive ? "bg-royal-50" : ""
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase tracking-wider leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
