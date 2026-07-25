import { SkeletonTable, SkeletonBlock, SkeletonCard } from "@/components/skeleton-loader";

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-8 w-64" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>

      {/* Active Cards Grid */}
      <div className="space-y-4">
        <SkeletonBlock className="h-6 w-40" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      <SkeletonTable />
    </main>
  );
}
