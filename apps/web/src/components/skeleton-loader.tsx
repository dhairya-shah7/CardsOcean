import React from "react";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft space-y-4">
      {/* Card Visual Placeholder */}
      <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 animate-pulse p-4 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="h-4 w-20 bg-slate-300/80" />
          <SkeletonBlock className="h-6 w-12 bg-slate-300/80 rounded-full" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-32 bg-slate-300/60" />
          <SkeletonBlock className="h-5 w-44 bg-slate-300/90" />
        </div>
      </div>

      {/* Title & Badge */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-3.5 w-3/4" />
      </div>

      {/* Button & Amount selector */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] py-6">
      <div className="space-y-6">
        <SkeletonBlock className="h-4 w-32 rounded-full" />
        <div className="space-y-3">
          <SkeletonBlock className="h-12 w-full max-w-xl" />
          <SkeletonBlock className="h-12 w-4/5 max-w-lg" />
        </div>
        <SkeletonBlock className="h-6 w-3/4 max-w-md" />
        <div className="flex gap-3 pt-2">
          <SkeletonBlock className="h-12 w-36 rounded-full" />
          <SkeletonBlock className="h-12 w-32 rounded-full" />
        </div>
      </div>
      <div className="aspect-[1.586/1] w-full rounded-[32px] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse border border-slate-200 shadow-soft" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8 space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>

      <SkeletonBlock className="h-12 w-full rounded-2xl bg-royal-500/20" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-9 w-32 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonLegalPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Banner Skeleton */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft space-y-4">
        <SkeletonBlock className="h-5 w-28" />
        <SkeletonBlock className="h-10 w-3/4" />
        <SkeletonBlock className="h-5 w-1/2" />
        <SkeletonBlock className="h-4 w-40" />
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft space-y-3">
          <SkeletonBlock className="h-9 w-full rounded-xl" />
          <SkeletonBlock className="h-4 w-28" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-6 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft space-y-4"
            >
              <SkeletonBlock className="h-7 w-64" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      <SkeletonHero />
      <div className="space-y-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-8 w-64" />
        </div>
        <SkeletonGrid count={6} />
      </div>
    </main>
  );
}
