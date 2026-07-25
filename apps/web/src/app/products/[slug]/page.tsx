import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { getProductBySlug } from "@/lib/api";
import { SectionHeading } from "@/components/section-heading";
import { ProductDetailPanel } from "@/components/product-detail-panel";
import { FALLBACK_PRODUCTS } from "@/lib/constants";
import { RuPayCard } from "@/components/rupay-card";

export const dynamic = "force-dynamic";

/** Returns all `/cards/slug*.ext` public paths for a product slug */
function getCardPhotos(slug: string): string[] {
  try {
    const cardsDir = join(process.cwd(), "public", "cards");
    if (!existsSync(cardsDir)) return [];
    const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
    const allImages = readdirSync(cardsDir)
      .filter((file) => {
        const lower = file.toLowerCase();
        const ext = "." + lower.split(".").pop();
        return exts.has(ext);
      })
      .sort();
    // First try: files starting with the product slug
    const slugMatches = allImages.filter((f) => f.toLowerCase().startsWith(slug.toLowerCase()));
    // Fallback: if no slug-specific photo, show ALL uploaded card photos
    const photos = slugMatches.length > 0 ? slugMatches : allImages;
    return photos.map((file) => `/cards/${file}`);
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  const fallbackProduct = FALLBACK_PRODUCTS.find((item) => item.slug === slug) ?? null;
  const resolvedProduct = product ?? fallbackProduct;

  if (!resolvedProduct) {
    notFound();
  }

  const reviews = "reviews" in resolvedProduct ? resolvedProduct.reviews ?? [] : [];
  const cardPhotos = getCardPhotos(slug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Product details"
        title={resolvedProduct.title}
        description={resolvedProduct.subtitle ?? resolvedProduct.description}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {/* Photo gallery — shows uploaded card photos, or falls back to gradient */}
          <RuPayCard product={resolvedProduct} photos={cardPhotos} />
          <div className="glass-card rounded-[28px] p-6">
            <h3 className="text-2xl font-semibold text-slate-900">Description</h3>
            <p className="mt-3 leading-7 text-slate-600">{resolvedProduct.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <ProductDetailPanel product={resolvedProduct} />
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex items-center gap-2 text-luxury-gold"><BadgeCheck className="h-4 w-4" /> Reviews</div>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">
                      {review.user?.name ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <div className="mt-1 text-amber-500 font-medium text-xs">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </div>
                  <p className="font-bold text-slate-900 mt-2 text-sm">{review.title}</p>
                  <p className="mt-1 text-slate-600 text-xs leading-5">{review.message}</p>
                </div>
              ))}
              {!reviews.length ? <p className="text-slate-500 text-xs">No reviews yet.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
