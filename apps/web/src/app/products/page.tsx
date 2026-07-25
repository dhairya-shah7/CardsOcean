import Link from "next/link";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { Search, SlidersHorizontal } from "lucide-react";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { FALLBACK_PRODUCTS } from "@/lib/constants";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Looks for a photo in /public/cards/ that starts with the product slug */
function getFirstCardPhoto(slug: string): string | null {
  try {
    const cardsDir = join(process.cwd(), "public", "cards");
    if (!existsSync(cardsDir)) return null;
    const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
    const allImages = readdirSync(cardsDir)
      .filter((file) => {
        const lower = file.toLowerCase();
        const ext = "." + lower.split(".").pop();
        return exts.has(ext);
      })
      .sort();
    // Prefer slug-specific match, then fall back to first available card photo
    const slugMatch = allImages.find((f) => f.toLowerCase().startsWith(slug.toLowerCase()));
    const pick = slugMatch ?? allImages[0] ?? null;
    return pick ? `/cards/${pick}` : null;
  } catch {
    return null;
  }
}

/** Merges uploaded card photos into the product image field */
function enrichProducts(products: Product[]): Product[] {
  return products.map((p) => {
    const photo = getFirstCardPhoto(p.slug);
    return photo ? { ...p, image: photo } : p;
  });
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const normalizedParams = {
    search: params.search,
    type: params.type,
    sort: params.sort
  };
  const products = await getProducts(normalizedParams).catch(() => []);
  const rawFeed = products.length ? products : FALLBACK_PRODUCTS;
  const productFeed = enrichProducts(rawFeed as Product[]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Marketplace"
        title="Browse premium gift cards"
        description="Explore virtual and physical cards with custom amount support."
        action={<Link href="/cart" className="secondary-btn">View cart</Link>}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.28fr_1fr]">
        <aside className="glass-card rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-luxury-gold"><SlidersHorizontal className="h-4 w-4" /> Filters</div>
          <form className="mt-4 space-y-4" method="get">
            <label className="block space-y-2 text-sm text-slate-600">
              <span>Search</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-royal-500" />
                <input name="search" defaultValue={normalizedParams.search} className="w-full bg-transparent text-slate-900 outline-none" placeholder="Search cards" />
              </div>
            </label>
            <label className="block space-y-2 text-sm text-slate-600">
              <span>Sort</span>
              <select name="sort" defaultValue={normalizedParams.sort} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none">
                <option value="popular">Popular</option>
                <option value="price_asc">Price low to high</option>
                <option value="price_desc">Price high to low</option>
              </select>
            </label>
            <button type="submit" className="primary-btn w-full">Apply filters</button>
          </form>
        </aside>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {productFeed.map((product) => <ProductCard key={product.id} product={product} />)}
        </section>
      </div>
    </main>
  );
}
