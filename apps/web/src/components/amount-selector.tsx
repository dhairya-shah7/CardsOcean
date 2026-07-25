"use client";

import { useEffect, useState } from "react";
import { MAX_CARD_AMOUNT, MIN_CARD_AMOUNT } from "@/lib/constants";

export function AmountSelector({
  value,
  onChange
}: {
  value: number;
  onChange: (nextValue: number) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function update(nextValue: number) {
    const bounded = Math.min(MAX_CARD_AMOUNT, Math.max(MIN_CARD_AMOUNT, nextValue));
    setLocalValue(bounded);
    onChange(bounded);
  }

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Custom amount</span>
        <span className="font-medium text-luxury-gold">₹{localValue.toLocaleString("en-IN")}</span>
      </div>
      <input
        type="range"
        min={MIN_CARD_AMOUNT}
        max={MAX_CARD_AMOUNT}
        step={100}
        value={localValue}
        onChange={(event) => update(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-royal-100 accent-luxury-gold"
      />
      <input
        type="number"
        min={MIN_CARD_AMOUNT}
        max={MAX_CARD_AMOUNT}
        value={localValue}
        onChange={(event) => update(Number(event.target.value))}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-royal-300"
      />
      <p className="text-xs text-slate-500">Choose any value from ₹1,000 to ₹10,000.</p>
    </div>
  );
}

