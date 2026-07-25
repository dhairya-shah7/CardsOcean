import { SkeletonForm, SkeletonBlock } from "@/components/skeleton-loader";

export default function CartLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-44" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
            >
              <div className="flex items-center gap-4">
                <SkeletonBlock className="h-16 w-24 rounded-xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-5 w-36" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              </div>
              <SkeletonBlock className="h-8 w-24 rounded-xl" />
            </div>
          ))}
        </div>
        <SkeletonForm />
      </div>
    </main>
  );
}
