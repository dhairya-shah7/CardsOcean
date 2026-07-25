"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { AmountSelector } from "./amount-selector";
import type { Product } from "@/lib/types";
import { MAX_CARD_AMOUNT, MIN_CARD_AMOUNT } from "@/lib/constants";
import { getApiUrl } from "@/lib/api";

const apiBaseUrl = getApiUrl();

export function ProductDetailPanel({ product }: { product: Product }) {
  const router = useRouter();
  const [amount, setAmount] = useState(product.minAmount);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => amount * quantity, [amount, quantity]);

  async function addToCart(goToCheckout = false) {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          amount,
          cardType: product.type
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add item to cart");
      }

      setStatus("Added to cart");
      if (goToCheckout) {
        router.push("/checkout");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="space-y-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <AmountSelector
        value={amount}
        onChange={(nextValue) => setAmount(Math.min(MAX_CARD_AMOUNT, Math.max(MIN_CARD_AMOUNT, nextValue)))}
      />

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Quantity</span>
          <span>{quantity}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-slate-900">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(10, current + 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span>Expected total</span>
          <span className="text-lg font-semibold text-luxury-gold">₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => addToCart(false)}
          disabled={busy}
          className="secondary-btn gap-2"
        >
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </button>
        <button
          type="button"
          onClick={() => addToCart(true)}
          disabled={busy}
          className="primary-btn gap-2"
        >
          <Check className="h-4 w-4" /> Buy now
        </button>
      </div>

      {status ? <p className="text-sm text-royal-600">{status}</p> : null}
    </aside>
  );
}
