import { SkeletonForm, SkeletonBlock } from "@/components/skeleton-loader";

export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Step Indicator Skeleton */}
      <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white p-4 shadow-soft">
        <SkeletonBlock className="h-6 w-28 rounded-full" />
        <SkeletonBlock className="h-6 w-28 rounded-full" />
        <SkeletonBlock className="h-6 w-28 rounded-full" />
      </div>

      <SkeletonForm />
    </main>
  );
}
