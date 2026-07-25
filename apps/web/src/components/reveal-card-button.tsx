"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { getApiUrl } from "@/lib/api";

const apiBaseUrl = getApiUrl();

export function RevealCardButton({ cardId }: { cardId: string }) {
  const [revealed, setRevealed] = useState<{ cardNumber: string; cvv: string; balance: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/cards/${cardId}/reveal`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to reveal card");
      }
      setRevealed(payload.data ?? payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reveal card");
    } finally {
      setBusy(false);
    }
  }

  if (revealed) {
    return (
      <div className="rounded-2xl border border-luxury-gold/20 bg-luxury-gold/10 p-4 text-sm text-slate-900">
        <div className="flex items-center gap-2 text-luxury-gold"><Eye className="h-4 w-4" /> Revealed securely</div>
        <p className="mt-3 font-mono text-base tracking-[0.18em]">{revealed.cardNumber}</p>
        <div className="mt-2 flex items-center justify-between text-slate-600">
          <span>CVV</span>
          <span>{revealed.cvv}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-slate-600">
          <span>Balance</span>
          <span>₹{revealed.balance.toLocaleString("en-IN")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={reveal}
        disabled={busy}
        className="primary-btn gap-2"
      >
        {busy ? <Lock className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        Reveal card
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
