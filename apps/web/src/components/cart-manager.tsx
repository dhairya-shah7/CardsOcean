"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/types";
import { getApiUrl } from "@/lib/api";
import { BillSummary } from "./bill-summary";

const apiBaseUrl = getApiUrl();

export function CartManager({ initialItems }: { initialItems: CartItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const fallbackImage = "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80";

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.amount * item.quantity, 0), [items]);

  async function updateItem(id: string, body: Record<string, unknown>) {
    setLoadingId(id);
    setMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/cart/items/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error("Cart update failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function removeItem(id: string) {
    setLoadingId(id);
    setMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/cart/items/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Cart removal failed");
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Item removed");
    } finally {
      setLoadingId(null);
    }
  }

  function mutateQuantity(id: string, nextQuantity: number) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item)));
    void updateItem(id, { quantity: nextQuantity }).catch((error) => {
      setMessage(error instanceof Error ? error.message : "Unable to update quantity");
    });
  }

  function mutateAmount(id: string, nextAmount: number) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, amount: nextAmount } : item)));
    void updateItem(id, { amount: nextAmount }).catch((error) => {
      setMessage(error instanceof Error ? error.message : "Unable to update amount");
    });
  }

  if (!items.length) {
    return <div className="glass-card rounded-[28px] p-8 text-slate-600">Your cart is empty.</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="glass-card rounded-[28px] p-5">
            <div className="flex flex-col gap-5 lg:flex-row">
              <img src={item.product?.image ?? fallbackImage} alt={item.product?.title ?? "Unavailable product"} className="h-36 w-full rounded-2xl object-cover lg:w-44" />
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">{item.product?.title ?? "Removed product"}</h3>
                    <p className="mt-2 text-sm text-slate-600">Custom amount per card</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={loadingId === item.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Quantity</span>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
                      <button type="button" onClick={() => mutateQuantity(item.id, Math.max(1, item.quantity - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={item.quantity}
                        onChange={(event) => mutateQuantity(item.id, Number(event.target.value))}
                        className="w-full bg-transparent text-center text-slate-900 outline-none"
                      />
                      <button type="button" onClick={() => mutateQuantity(item.id, Math.min(10, item.quantity + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Amount per card</span>
                    <input
                      type="number"
                      min={1000}
                      max={10000}
                      value={item.amount}
                      onChange={(event) => mutateAmount(item.id, Number(event.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                    />
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="text-slate-500">Line total</p>
                    <p className="mt-1 text-xl font-semibold text-luxury-gold">₹{(item.amount * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="space-y-4">
        <BillSummary
          rows={[
            { label: "Gift Card Face Value", value: `₹${subtotal.toLocaleString("en-IN")}`, emphasize: true },
            { label: "Convenience Charges", value: "Calculated at checkout" }
          ]}
          subtotal={`₹${subtotal.toLocaleString("en-IN")}`}
          total={`₹${subtotal.toLocaleString("en-IN")}`}
          footer={<a href="/checkout" className="primary-btn w-full">Proceed to checkout</a>}
        />
        {message ? <div className="glass-card rounded-[28px] px-5 py-4 text-sm text-royal-600">{message}</div> : null}
      </aside>
    </div>
  );
}

