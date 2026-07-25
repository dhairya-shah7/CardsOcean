import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import "./globals.css";
import { getBrand } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";
import { DevToolsGuard } from "@/components/devtools-guard";

export const metadata: Metadata = {
  title: "Premium Gift Card Marketplace",
  description: "Luxury fintech marketplace for custom prepaid gift cards."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrand();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isLoginPage = pathname.startsWith("/login");

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-white font-sans text-slate-900 antialiased"
        style={
          {
            "--font-space": '"Segoe UI", system-ui, sans-serif',
            "--font-display": '"Georgia", "Times New Roman", serif'
          } as CSSProperties
        }
      >
        <DevToolsGuard />
        <div className="min-h-screen bg-market-grid">
          {!isLoginPage && <SiteHeader brand={brand} />}
          
          {isLoginPage ? (
            <div className="min-h-screen flex items-center justify-center">
              {children}
            </div>
          ) : (
            <>
              {/* pb-20 on mobile ensures content clears the fixed bottom nav (h-16 + safe area) */}
              <div className="min-h-[calc(100vh-4rem)] pb-20 xl:pb-0">
                {children}
              </div>
              <footer className="border-t border-slate-200 bg-white/95 pb-20 xl:pb-0">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
                  <p>
                    {brand.name} · {brand.tagline}
                  </p>
                  <nav className="flex flex-wrap gap-4">
                    <Link href="/terms" className="transition hover:text-royal-500">
                      Terms
                    </Link>
                    <Link href="/privacy" className="transition hover:text-royal-500">
                      Privacy
                    </Link>
                  </nav>
                </div>
              </footer>
            </>
          )}
        </div>
        {/* Fixed bottom nav — rendered outside the scroll container so it never collides */}
        {!isLoginPage && <MobileNav />}
      </body>
    </html>
  );
}
