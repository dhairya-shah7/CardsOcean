import { SkeletonForm, SkeletonBlock } from "@/components/skeleton-loader";

export default function BalanceLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 space-y-8">
      <div className="text-center space-y-3">
        <SkeletonBlock className="mx-auto h-8 w-56" />
        <SkeletonBlock className="mx-auto h-4 w-80" />
      </div>
      <SkeletonForm />
    </main>
  );
}
