"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, LogOut, Settings, User } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import type { BrandConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getMe, logout } from "@/lib/api";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/cart", label: "Cart" }
];


export function SiteHeader({ brand }: { brand: BrandConfig }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const visibleNavItems = useMemo(() => {
    const items = [...navItems];
    const adminEmails = ["rugs1007@gmail.com", "dhairyaqwerty1@gmail.com"];
    const isAdmin = user && (user.role === "ADMIN" || adminEmails.includes(user.email?.toLowerCase().trim()));
    if (isAdmin) {
      items.push({ href: "/admin", label: "Admin" });
    }
    return items;
  }, [user]);

  const brandInitials = useMemo(
    () =>
      brand.name
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [brand.name]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const u = await getMe();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) {
          setUser(null);
          window.location.href = "/login";
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadUser();
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      setDropdownOpen(false);
      window.location.href = "/";
    } catch {
      // fallback
      setUser(null);
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 text-slate-900 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        {/* Brand logo + name */}
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-royal-200 bg-royal-50 text-sm font-semibold text-royal-600 shadow-glow">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-8 w-8 rounded-xl object-contain" />
            ) : (
              brandInitials
            )}
          </span>
          <span className="block text-lg font-bold text-royal-600 logo-font">
            {brand.name}
          </span>
        </Link>

        {/* Desktop search bar */}
        <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
            <Search className="h-4 w-4 text-royal-500" />
            Search cards, collections, or brands
          </div>
        </div>

        {/* Desktop pill nav — only on xl+ */}
        <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-sm text-slate-600 xl:flex">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 transition",
                pathname === item.href
                  ? "bg-royal-500 text-white"
                  : "hover:bg-royal-50 hover:text-royal-600"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* User Profile Dropdown Button */}
          {!loading && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-royal-100 border border-royal-200 text-royal-700 transition hover:bg-royal-200 shadow-sm"
              >
                <User className="h-5 w-5" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                  </div>
                  <div className="mt-1 space-y-1">
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-royal-50 hover:text-royal-600 text-left"
                    >
                      <Settings className="h-4 w-4" />
                      Edit Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !loading && !user ? (
            <Link
              href="/login"
              className="rounded-full bg-royal-600 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-royal-700"
            >
              Login
            </Link>
          ) : null}

          {/* Cart button — visible on md+ */}
          <Link
            href="/cart"
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-royal-200 hover:bg-royal-50 md:flex"
          >
            <ShoppingCart className="h-4 w-4 text-royal-500" />
            Cart
          </Link>
        </div>
      </div>

    </header>
  );
}
