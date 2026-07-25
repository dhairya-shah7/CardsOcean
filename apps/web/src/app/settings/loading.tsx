import { SkeletonForm, SkeletonBlock } from "@/components/skeleton-loader";

export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      <SkeletonForm />
    </main>
  );
}
