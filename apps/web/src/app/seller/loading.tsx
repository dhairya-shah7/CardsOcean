import { SkeletonTable, SkeletonBlock } from "@/components/skeleton-loader";

export default function SellerLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonBlock className="h-24 w-full rounded-2xl" />
        <SkeletonBlock className="h-24 w-full rounded-2xl" />
        <SkeletonBlock className="h-24 w-full rounded-2xl" />
        <SkeletonBlock className="h-24 w-full rounded-2xl" />
      </div>
      <SkeletonTable />
    </main>
  );
}
