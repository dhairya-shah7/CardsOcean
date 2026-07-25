import { SkeletonBlock } from "@/components/skeleton-loader";

export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2 items-start">
        {/* Card visual skeleton */}
        <div className="aspect-[1.586/1] w-full rounded-[32px] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse border border-slate-200 p-6 shadow-soft" />

        {/* Product info skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-10 w-3/4" />
            <SkeletonBlock className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-2/3" />
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <SkeletonBlock className="h-6 w-40" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-10 w-20 rounded-xl" />
              ))}
            </div>
            <SkeletonBlock className="h-12 w-full rounded-2xl bg-royal-500/20" />
          </div>
        </div>
      </div>
    </main>
  );
}
