import { SkeletonTable, SkeletonBlock } from "@/components/skeleton-loader";

export default function OrdersLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      <SkeletonTable />
    </main>
  );
}
