"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const fallbackGradient =
    "bg-[linear-gradient(135deg,#7c3aed_0%,#f59e0b_34%,#ec4899_68%,#4338ca_100%)]";

  return (
    <motion.article whileHover={{ y: -6, rotateX: 3 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-royal-50 via-transparent to-luxury-gold/10 opacity-0 transition group-hover:opacity-100" />

      {/* Card image or gradient */}
      <div className={`relative aspect-[4/3] overflow-hidden rounded-t-[28px] ${product.image ? "" : fallbackGradient} p-5`}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        {/* Overlay info */}
        <div className={`relative flex items-center justify-between text-xs uppercase tracking-[0.3em] ${product.image ? "text-white drop-shadow" : "text-white/75"}`}>
          <span>RuPay Gift Card</span>
        </div>
        {!product.image && (
          <div className="mt-8">
            <p className="text-sm text-white/75">Available range</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">
              ₹{product.minAmount.toLocaleString("en-IN")} – ₹{product.maxAmount.toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>

      <div className="relative space-y-4 p-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{product.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.subtitle ?? product.description}</p>
        </div>
        <div className="text-sm text-slate-600">
          <span>₹{product.minAmount.toLocaleString("en-IN")} - ₹{product.maxAmount.toLocaleString("en-IN")}</span>
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="primary-btn w-full"
        >
          View details
        </Link>
      </div>
    </motion.article>
  );
}
