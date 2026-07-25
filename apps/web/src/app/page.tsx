import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getFeaturedProducts, getProducts } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { HeroShowcase } from "@/components/hero-showcase";
import { FALLBACK_PRODUCTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredProducts, products] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getProducts({ sort: "popular" }).catch(() => [])
  ]);

  const showcaseProduct = featuredProducts[0] ?? products[0] ?? FALLBACK_PRODUCTS[0];
  const featuredFeed = featuredProducts.length ? featuredProducts : FALLBACK_PRODUCTS.slice(0, 3);
  const trendingFeed = products.length ? products : FALLBACK_PRODUCTS.slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-none text-balance text-slate-900 sm:text-6xl lg:text-7xl">
              A premium marketplace for custom gift cards.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 sm:text-xl">
              Discover virtual and physical prepaid cards with custom amounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="primary-btn rounded-full px-6">
              Shop cards <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/orders" className="secondary-btn rounded-full px-6">
              View orders
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-luxury-gold/15 blur-3xl" />
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-royal-500/15 blur-3xl" />
          <HeroShowcase product={showcaseProduct} />
        </div>
      </section>

      <section className="mt-16 space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-royal-500">Featured</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Handpicked for you</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {featuredFeed.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-16 space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-royal-500">Trending collections</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Virtual cards, physical cards, and everything in between.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trendingFeed.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

