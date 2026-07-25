import { SkeletonTable, SkeletonBlock } from "@/components/skeleton-loader";

export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <SkeletonBlock className="h-28 w-full rounded-2xl" />
        <SkeletonBlock className="h-28 w-full rounded-2xl" />
        <SkeletonBlock className="h-28 w-full rounded-2xl" />
      </div>
      <SkeletonTable />
    </main>
  );
}
