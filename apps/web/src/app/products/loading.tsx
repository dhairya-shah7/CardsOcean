import { SkeletonGrid, SkeletonBlock } from "@/components/skeleton-loader";

export default function ProductsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-9 w-64" />
        <SkeletonBlock className="h-4 w-96" />
      </div>
      <SkeletonGrid count={6} />
    </main>
  );
}
