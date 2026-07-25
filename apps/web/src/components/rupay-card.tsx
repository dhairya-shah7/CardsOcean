"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";

interface CardPhotoGalleryProps {
  product?: Product;
  /**
   * List of image paths to show. Pass `/cards/your-card.jpg` style paths.
   * Falls back to the product.image, then to the gradient placeholder.
   */
  photos?: string[];
}

function GradientFallback({ product }: { product?: Product }) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#7c3aed_0%,#f59e0b_34%,#ec4899_68%,#4338ca_100%)] p-6 text-white shadow-glow">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/75">
        <span>RuPay Gift Card</span>
        <span>{product?.type === "VIRTUAL" ? "Virtual" : product?.type === "PHYSICAL" ? "Physical" : "Gift Card"}</span>
      </div>
      <div className="mt-12 space-y-4">
        <div>
          <p className="text-sm text-white/75">Available range</p>
          {product ? (
            <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">
              ₹{product.minAmount.toLocaleString("en-IN")} – ₹{product.maxAmount.toLocaleString("en-IN")}
            </p>
          ) : (
            <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">₹2,500</p>
          )}
        </div>
        {product?.subtitle ? (
          <p className="max-w-sm text-sm text-white/80">{product.subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * CardPhotoGallery
 *
 * Shows photos from `/public/cards/` folder.
 * Drop card images named like `aurora-signature.jpg` or `my-card-1.jpg` into
 * `apps/web/public/cards/` — they'll show here automatically when you pass them as `photos`.
 *
 * Falls back to: product.image → gradient placeholder
 */
export function RuPayCard({ product, photos }: CardPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Build the photo list: explicit photos > product.image > null (show gradient)
  const imageList: string[] = photos && photos.length > 0
    ? photos
    : product?.image
      ? [product.image]
      : [];

  if (imageList.length === 0) {
    return <GradientFallback product={product} />;
  }

  const activePhoto = imageList[activeIndex];
  const hasMultiple = imageList.length > 1;

  function prev() {
    setActiveIndex((i) => (i === 0 ? imageList.length - 1 : i - 1));
  }

  function next() {
    setActiveIndex((i) => (i === imageList.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft">
      {/* Main photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activePhoto}
          alt={product?.title ?? "Gift card photo"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay badge */}
        <div className="absolute bottom-4 left-4 rounded-full bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white backdrop-blur-sm">
          {product?.type === "VIRTUAL" ? "Virtual" : product?.type === "PHYSICAL" ? "Physical" : "Gift Card"}
        </div>

        {/* Navigation arrows (only if multiple photos) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip (only if multiple photos) */}
      {hasMultiple && (
        <div className="flex gap-2 p-3">
          {imageList.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={`h-14 w-14 overflow-hidden rounded-xl border-2 transition ${
                idx === activeIndex
                  ? "border-royal-500 ring-2 ring-royal-200"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
