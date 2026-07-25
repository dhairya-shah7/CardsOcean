"use client";

import { SunMedium } from "lucide-react";

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-royal-500 transition hover:border-royal-200 hover:bg-royal-50"
      aria-label="Theme is fixed to light"
      disabled
    >
      <SunMedium className="h-5 w-5" />
    </button>
  );
}
