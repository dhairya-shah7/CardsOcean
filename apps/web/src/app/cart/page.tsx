"use client";

import { useEffect, useState } from "react";
import { getCartItems } from "@/lib/api";
import { SectionHeading } from "@/components/section-heading";
import { CartManager } from "@/components/cart-manager";
import type { CartItem } from "@/lib/types";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadCart() {
      try {
        const items = await getCartItems();
        if (!cancelled) {
          setCartItems(items);
        }
      } catch (err) {
        console.error("Failed to load cart items:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadCart();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Cart"
        title="Checkout basket"
        description="Review quantities, adjust custom amounts per line item, and continue when everything is ready."
      />
      <div className="mt-8">
        {loading ? (
          <p className="animate-pulse text-sm text-slate-400 font-medium">Loading basket…</p>
        ) : (
          <CartManager initialItems={cartItems} />
        )}
      </div>
    </main>
  );
}
