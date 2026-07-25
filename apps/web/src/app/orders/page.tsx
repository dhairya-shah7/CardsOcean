"use client";

import { useEffect, useState } from "react";
import { getOrders, emailInvoice } from "@/lib/api";
import { SectionHeading } from "@/components/section-heading";
import { BillSummary } from "@/components/bill-summary";
import type { Order } from "@/lib/types";

function InvoiceActions({ orderId }: { orderId: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleEmailInvoice = async () => {
    setSending(true);
    setError("");
    setSent(false);
    try {
      await emailInvoice(orderId);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to email invoice.");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadInvoice = () => {
    window.open(`/api/orders/${orderId}/invoice/download`, "_blank");
  };

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <button
        onClick={handleDownloadInvoice}
        className="inline-flex flex-1 items-center justify-center rounded-2xl bg-royal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-royal-700 cursor-pointer"
      >
        Download Invoice
      </button>
      <button
        onClick={handleEmailInvoice}
        disabled={sending}
        className="inline-flex flex-1 items-center justify-center rounded-2xl border border-royal-500 bg-transparent px-4 py-2.5 text-sm font-semibold text-royal-600 transition hover:bg-royal-50 disabled:opacity-60 cursor-pointer"
      >
        {sending ? "Sending..." : sent ? "✓ Sent to Gmail" : "Email Invoice to Gmail"}
      </button>
      {error && <p className="text-xs text-red-500 text-center w-full">{error}</p>}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await getOrders();
        if (cancelled) return;
        setOrders(res);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchOrders();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Orders"
        title="Purchase history with delivery state"
        description="Track order status, issued cards, and card activation at a glance."
      />
      <div className="mt-8 grid gap-4">
        {loading ? (
          <p className="animate-pulse text-sm text-slate-400">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No orders found.
          </div>
        ) : (
          orders.map((order) => {
            const faceValue = order.subtotalAmount ?? order.totalAmount;
            const paymentCharges = Math.round(faceValue * 0.01);
            const platformFee = Math.round(faceValue * 0.02);
            const convenienceCharge = paymentCharges + platformFee;
            const gstAmount = Math.round(convenienceCharge * 0.18);
            const deliveryCharge = order.deliveryMethod === "PHYSICAL" ? 50 : 0;

            const summaryRows = [
              { label: "Gift Card Face Value", value: `₹${faceValue.toLocaleString("en-IN")}`, emphasize: true },
              { label: "Payment Charges (1.0%)", value: `₹${paymentCharges.toLocaleString("en-IN")}` },
              { label: "Platform Fees (2.0%)", value: `₹${platformFee.toLocaleString("en-IN")}` },
              { label: "GST (18% on convenience fee)", value: `₹${gstAmount.toLocaleString("en-IN")}` },
              ...(order.deliveryMethod === "PHYSICAL" ? [{ label: "Physical Delivery Charges", value: `₹${deliveryCharge.toLocaleString("en-IN")}` }] : [])
            ];

            return (
              <article key={order.id} className="glass-card rounded-[28px] p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-royal-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-900">₹{order.totalAmount.toLocaleString("en-IN")}</h3>
                  </div>
                  <div className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">{order.paymentStatus} / {order.deliveryStatus}</div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm text-slate-700">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">{item.title} · Qty {item.quantity} · ₹{item.amount.toLocaleString("en-IN")}</div>
                  ))}
                </div>
                <div className="mt-5">
                  <BillSummary
                    rows={summaryRows}
                    subtotal={`₹${faceValue.toLocaleString("en-IN")}`}
                    total={`₹${order.totalAmount.toLocaleString("en-IN")}`}
                    footer={<InvoiceActions orderId={order.id} />}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}


