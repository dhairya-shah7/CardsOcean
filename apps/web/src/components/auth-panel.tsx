"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, UserRound, ArrowRight, RotateCcw } from "lucide-react";
import { getApiUrl } from "@/lib/api";

const apiBaseUrl = getApiUrl();

type Step = "email" | "otp";

export function AuthPanel() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isNewUser, setIsNewUser] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [brandName, setBrandName] = useState(typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_APP_NAME ?? "Cards Ocean") : "Cards Ocean");
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch brand config
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/meta/brand`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.data) {
          if (res.data.name) setBrandName(res.data.name);
          if (res.data.logoUrl) setBrandLogoUrl(res.data.logoUrl);
        }
      })
      .catch(() => {});
  }, []);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = text[i] || "";
      }
      setOtp(newOtp);
      const focusIndex = Math.min(text.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  }

  async function sendOtp() {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setError("Please enter your name (at least 2 characters)");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message ?? "Failed to send verification code");
      }

      setIsNewUser(data?.data?.isNewUser ?? false);
      setMessage("Verification code sent! Check your email.");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/verify-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
          name: name.trim()
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message ?? "Verification failed");
      }

      setMessage("Welcome! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  function resetFlow() {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setMessage(null);
    setError(null);
  }

  const brandInitials = brandName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-royal-200 bg-royal-50 text-sm font-semibold text-royal-600 shadow-glow">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt={brandName} className="h-8 w-8 rounded-xl object-contain" />
          ) : (
            brandInitials
          )}
        </span>
        <h2 className="text-4xl font-extrabold tracking-tight text-royal-600 logo-font">
          {brandName}
        </h2>
      </div>

      <div className="glass-card rounded-[32px] p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.28em] text-royal-500">
            {step === "email" ? "Welcome" : "Verify email"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {step === "email" ? "Sign in to your account" : "Enter verification code"}
          </h1>
          {step === "otp" && (
            <p className="mt-2 text-sm text-slate-500">
              We sent a 6-digit code to <strong className="text-slate-700">{email}</strong>
            </p>
          )}
        </div>

        <div className="space-y-5">
          {/* Step 1: Email + Name */}
          {step === "email" && (
            <>
              <label className="block space-y-2 text-sm text-slate-600">
                <span>Your Name</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-royal-300 focus-within:ring-2 focus-within:ring-royal-100">
                  <UserRound className="h-4 w-4 text-royal-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Enter your name"
                    autoFocus
                  />
                </div>
              </label>

              <label className="block space-y-2 text-sm text-slate-600">
                <span>Email address</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-royal-300 focus-within:ring-2 focus-within:ring-royal-100">
                  <Mail className="h-4 w-4 text-royal-500 flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && !busy && sendOtp()}
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={() => void sendOtp()}
                disabled={busy}
                className="primary-btn mt-2 w-full flex items-center justify-center gap-2"
              >
                {busy ? "Sending..." : "Continue"}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </>
          )}

          {/* Step 2: OTP (6 boxes) */}
          {step === "otp" && (
            <>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="h-14 w-12 rounded-2xl border border-slate-200 bg-white text-center text-xl font-semibold text-slate-900 outline-none transition focus:border-royal-400 focus:ring-2 focus:ring-royal-100 sm:h-16 sm:w-14"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => void verifyOtp()}
                disabled={busy || otp.join("").length !== 6}
                className="primary-btn mt-2 w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? "Verifying..." : "Verify code"}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => void sendOtp()}
                  disabled={busy}
                  className="text-royal-600 hover:text-royal-700 flex items-center gap-1 transition disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="text-slate-500 hover:text-slate-700 transition"
                >
                  Change details
                </button>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && !error && (
          <p className="mt-4 text-sm text-royal-600">{message}</p>
        )}
      </div>
    </div>
  );
}
