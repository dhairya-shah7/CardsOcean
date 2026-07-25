"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle2, CreditCard, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/types";
import { BillSummary } from "./bill-summary";
import { getApiUrl, getCartItems, getMe, removeCartItem, updateCartItem, updateProfile, getCards } from "@/lib/api";

const STORAGE_KEY = "mufin_checkout_state";

const INDIAN_CITIES = [
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Delhi", state: "Delhi" },
  { city: "Ernakulam", state: "Kerala" },
  { city: "Faridabad", state: "Haryana" },
  { city: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Ooty", state: "Tamil Nadu" },
  { city: "Patna", state: "Bihar" },
  { city: "Quilon", state: "Kerala" },
  { city: "Ranchi", state: "Jharkhand" },
  { city: "Surat", state: "Gujarat" },
  { city: "Trivandrum", state: "Kerala" },
  { city: "Udaipur", state: "Rajasthan" },
  { city: "Vadodara", state: "Gujarat" },
  { city: "Warangal", state: "Telangana" },
  { city: "Yamunanagar", state: "Haryana" },
  { city: "Zirakpur", state: "Punjab" }
];

type DeliveryChoice = "VIRTUAL" | "PHYSICAL";

interface SavedState {
  activeStep: 1 | 2 | 3;
  delivery: DeliveryChoice;
  address: { line1: string; line2: string; city: string; state: string; postalCode: string; country: string };
  verification: { mobileNumber: string; panNumber: string; email: string };
}

function getDefaultState(): SavedState {
  return {
    activeStep: 1,
    delivery: "VIRTUAL",
    address: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" },
    verification: { mobileNumber: "", panNumber: "", email: "" }
  };
}

// ── Tiny field-error helper ────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

// ── Styled input/select wrappers that show an error border ─────────────────
function inputClass(hasError: boolean) {
  return `rounded-2xl border ${hasError ? "border-red-400 bg-red-50" : "border-slate-200"} px-4 py-3 text-slate-900 outline-none w-full`;
}
function selectClass(hasError: boolean) {
  return `rounded-2xl border ${hasError ? "border-red-400 bg-red-50" : "border-slate-200"} px-4 py-3 text-slate-900 bg-white outline-none w-full`;
}

export function CheckoutWizard() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [activeStep, setActiveStepRaw] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [delivery, setDeliveryRaw] = useState<DeliveryChoice>("VIRTUAL");
  const [address, setAddressRaw] = useState({ line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" });
  const [verification, setVerificationRaw] = useState({ mobileNumber: "", panNumber: "", email: "" });
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [cartActionId, setCartActionId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);

  // ── Validation error maps ────────────────────────────────────────────────
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  const [otpSent, setOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [mobileOtpError, setMobileOtpError] = useState("");
  const mobileOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first mobile OTP box when entering OTP step
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => mobileOtpRefs.current[0]?.focus(), 100);
    }
  }, [otpSent]);

  function handleMobileOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...mobileOtp];
    newOtp[index] = digit;
    setMobileOtp(newOtp);
    setMobileOtpError("");

    if (digit && index < 5) {
      mobileOtpRefs.current[index + 1]?.focus();
    }
  }

  function handleMobileOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !mobileOtp[index] && index > 0) {
      mobileOtpRefs.current[index - 1]?.focus();
    }
  }

  function handleMobileOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length > 0) {
      const newOtp = [...mobileOtp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = text[i] || "";
      }
      setMobileOtp(newOtp);
      const focusIndex = Math.min(text.length, 5);
      mobileOtpRefs.current[focusIndex]?.focus();
    }
  }

  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, boolean>>({});
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; title: string; message: string }>>({});
  const [cardsRemaining, setCardsRemaining] = useState<number | null>(null);

  // Load from sessionStorage once mounted on the client
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedState;
        if (parsed.activeStep) setActiveStepRaw(parsed.activeStep);
        if (parsed.delivery) setDeliveryRaw(parsed.delivery);
        if (parsed.address) setAddressRaw(parsed.address);
        if (parsed.verification) setVerificationRaw(parsed.verification);
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch logged-in user profile to prefill verification details if empty
  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const u = await getMe();
        if (cancelled) return;
        setProfileUser(u);
        const isDemo = u.email === "user@elitepay.dev" || u.name === "Demo Buyer";
        setVerificationRaw((prev) => ({
          ...prev,
          mobileNumber: prev.mobileNumber || (isDemo ? "" : (u.phone || "")),
          email: prev.email || (isDemo ? "" : u.email)
        }));

        if (!isDemo) {
          setRecipientName((prev) => prev || u.name || "");
          setGender((prev) => prev || u.gender || "");
          setDob((prev) => prev || u.dob || "");
          setAddressRaw((prev) => ({
            ...prev,
            line1: prev.line1 || u.deliveryAddressLine1 || "",
            line2: prev.line2 || u.deliveryAddressLine2 || "",
            city: prev.city || u.deliveryCity || "",
            state: prev.state || u.deliveryState || "",
            postalCode: prev.postalCode || u.deliveryPostalCode || "",
            country: prev.country || u.deliveryCountry || "India"
          }));
        }
      } catch { /* ignore */ }
    }
    void loadUser();
    return () => { cancelled = true; };
  }, []);

  // Fetch quota limit
  useEffect(() => {
    let cancelled = false;
    async function checkQuota() {
      try {
        const user = await getMe();
        if (user.role === "ADMIN") {
          if (!cancelled) setCardsRemaining(Infinity);
          return;
        }
        const cards = await getCards();
        const currentYear = new Date().getFullYear();
        const cardsThisYear = cards.filter(c => {
          const year = new Date(c.createdAt).getFullYear();
          return year === currentYear;
        }).length;
        if (!cancelled) setCardsRemaining(Math.max(0, 100 - cardsThisYear));
      } catch {
        if (!cancelled) setCardsRemaining(100);
      }
    }
    void checkQuota();
    return () => { cancelled = true; };
  }, []);

  // Persist to sessionStorage whenever any key piece of state changes
  function persist(patch: Partial<SavedState>) {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as SavedState) : getDefaultState();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
    } catch { /* ignore */ }
  }

  function setActiveStep(step: 1 | 2 | 3) {
    setActiveStepRaw(step);
    persist({ activeStep: step });
  }

  function setDelivery(d: DeliveryChoice) {
    setDeliveryRaw(d);
    persist({ delivery: d });
    // Clear address errors when switching delivery type
    setStep1Errors({});
  }

  function setAddress(updater: (prev: typeof address) => typeof address) {
    setAddressRaw((prev) => {
      const next = updater(prev);
      persist({ address: next });
      return next;
    });
  }

  function setVerification(updater: (prev: typeof verification) => typeof verification) {
    setVerificationRaw((prev) => {
      const next = updater(prev);
      persist({ verification: next });
      return next;
    });
  }

  const faceValue = useMemo(
    () => items.reduce((sum, item) => sum + item.amount * item.quantity, 0) || 2500,
    [items]
  );
  
  const paymentCharges = Math.round(faceValue * 0.01);
  const platformFee = Math.round(faceValue * 0.02);
  const convenienceCharge = paymentCharges + platformFee;
  const gstAmount = Math.round(convenienceCharge * 0.18);
  const taxAmount = convenienceCharge + gstAmount;
  
  const deliveryCharge = delivery === "PHYSICAL" ? 50 : 0;
  const totalAmount = faceValue + taxAmount + deliveryCharge;

  const summaryRows = [
    { label: "Gift Card Face Value", value: `₹${faceValue.toLocaleString("en-IN")}`, emphasize: true },
    { label: "Payment Charges (1.0%)", value: `₹${paymentCharges.toLocaleString("en-IN")}` },
    { label: "Platform Fees (2.0%)", value: `₹${platformFee.toLocaleString("en-IN")}` },
    { label: "GST (18% on convenience fee)", value: `₹${gstAmount.toLocaleString("en-IN")}` },
    ...(delivery === "PHYSICAL" ? [{ label: "Physical Delivery Charges", value: `₹${deliveryCharge.toLocaleString("en-IN")}` }] : [])
  ];

  useEffect(() => {
    let cancelled = false;
    async function loadCart() {
      try {
        const cartItems = await getCartItems();
        if (!cancelled) setItems(cartItems);
      } catch {
        // network error — items stays empty
      } finally {
        if (!cancelled) setCartLoading(false);
      }
    }
    void loadCart();
    return () => { cancelled = true; };
  }, []);

  async function handleRemoveItem(id: string) {
    setCartActionId(id);
    setStatus(null);
    try {
      await removeCartItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setStatus(`❌ ${error instanceof Error ? error.message : "Unable to remove item"}`);
    } finally {
      setCartActionId(null);
    }
  }

  function handleQuantityChange(id: string, nextQuantity: number) {
    const clamped = Math.max(1, Math.min(10, nextQuantity));
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity: clamped } : item))
    );
    setCartActionId(id);
    setStatus(null);
    void updateCartItem(id, { quantity: clamped })
      .catch((error) => {
        setStatus(`❌ ${error instanceof Error ? error.message : "Unable to update quantity"}`);
        void getCartItems().then(setItems).catch(() => {});
      })
      .finally(() => setCartActionId(null));
  }

  // ── Step 1 validation ─────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const errs: Record<string, string> = {};

    if (!recipientName.trim()) errs.recipientName = "Cardholder name is required.";
    if (!gender) errs.gender = "Please select a gender.";
    if (!dob) errs.dob = "Date of birth is required.";

    if (delivery === "PHYSICAL") {
      if (!address.line1.trim()) errs.line1 = "Address line 1 is required.";
      if (!address.city) errs.city = "Please select a city.";
      if (!address.postalCode.trim()) errs.postalCode = "PIN code is required.";
      else if (!/^\d{6}$/.test(address.postalCode.trim())) errs.postalCode = "Enter a valid 6-digit PIN code.";
    }

    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Step 2 validation ─────────────────────────────────────────────────────
  function validateStep2(): boolean {
    const errs: Record<string, string> = {};

    if (!verification.mobileNumber.trim()) {
      errs.mobileNumber = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(verification.mobileNumber.trim())) {
      errs.mobileNumber = "Enter a valid 10-digit Indian mobile number.";
    }

    const adminEmails = ["rugs1007@gmail.com", "dhairyaqwerty1@gmail.com"];
    const isAdmin = profileUser && (profileUser.role === "ADMIN" || adminEmails.includes(profileUser.email?.toLowerCase().trim()));

    if (!isAdmin) {
      if (!verification.panNumber.trim()) {
        errs.panNumber = "PAN number is required.";
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(verification.panNumber.trim())) {
        errs.panNumber = "Enter a valid PAN (e.g. ABCDE1234F).";
      }
    }

    if (!verification.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verification.email.trim())) {
      errs.email = "Enter a valid email address.";
    }

    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  }

  async function sendVerificationCodes() {
    if (!validateStep2()) return;
    setBusy(true);
    setStatus(null);
    setMobileOtpError("");

    try {
      // Request mobile OTP
      const phonePayload = {
        phone: verification.mobileNumber.trim(),
        purpose: "SMS_VERIFY"
      };
      const phoneRes = await fetch(`${getApiUrl()}/api/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phonePayload)
      });
      const phoneData = await phoneRes.json().catch(() => null);
      if (!phoneRes.ok) {
        throw new Error(phoneData?.message ?? "Failed to request OTP for mobile number.");
      }

      setOtpSent(true);
      setStatus("Verification code sent to your mobile.");
    } catch (error) {
      setStatus(`❌ ${error instanceof Error ? error.message : "Failed to send verification code"}`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyDetailsAndOtps() {
    if (!validateStep2()) return;

    let hasOtpErrors = false;
    setMobileOtpError("");

    const code = mobileOtp.join("");
    if (code.length !== 6) {
      setMobileOtpError("Enter a valid 6-digit verification code.");
      hasOtpErrors = true;
    }

    if (hasOtpErrors) return;

    setBusy(true);
    setStatus(null);

    try {
      // 1. Verify mobile OTP
      const phoneVerifyPayload = {
        phone: verification.mobileNumber.trim(),
        code: code,
        purpose: "SMS_VERIFY"
      };
      const phoneVerifyRes = await fetch(`${getApiUrl()}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phoneVerifyPayload)
      });
      const phoneVerifyData = await phoneVerifyRes.json().catch(() => null);
      if (!phoneVerifyRes.ok) {
        throw new Error(phoneVerifyData?.message ?? "Invalid mobile verification code.");
      }

      // 2. Verify PAN
      const panPayload = {
        mobileNumber: verification.mobileNumber.trim(),
        panNumber: verification.panNumber.trim().toUpperCase(),
        email: verification.email.trim().toLowerCase()
      };

      const panResponse = await fetch(`${getApiUrl()}/api/verify-pan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panPayload)
      });
      const panData = await panResponse.json().catch(() => null);
      if (!panResponse.ok) {
        throw new Error(panData?.message ?? "PAN verification failed. Please check your details.");
      }

      setActiveStep(3);
      setStatus("Identity verification complete.");
    } catch (error) {
      setStatus(`❌ ${error instanceof Error ? error.message : "Verification failed"}`);
    } finally {
      setBusy(false);
    }
  }

  async function continueCheckout() {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`${getApiUrl()}/api/checkout/session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: delivery,
          emailOtpVerified: true,
          smsOtpVerified: true,
          captchaToken: "bypass_token",
          paymentProvider: "PLACEHOLDER",
          cardHolderName: recipientName,
          gender: gender,
          dob: dob,
          chosenCard: items.map(item => `${item.product?.title ?? "Gift Card"} (₹${item.amount})`).join("; "),
          email: verification.email.trim().toLowerCase(),
          mobileNumber: verification.mobileNumber.trim(),
          // Only send address when Physical is chosen
          address: delivery === "PHYSICAL" ? {
            label: "Shipping Address",
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country || "India"
          } : undefined
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message ?? "Checkout failed");
      }

      // Clear persisted state on successful checkout
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      setOrderedItems(items);
      setItems([]);
      setPlacedOrderId(data?.data?.order?.id || data?.order?.id || null);
      setCheckoutCompleted(true);
      setStatus("✅ Order placed! Payment integration coming soon. Your order details have been recorded.");
    } catch (error) {
      setStatus(`❌ ${error instanceof Error ? error.message : "Checkout failed"}`);
    } finally {
      setBusy(false);
    }
  }

  const handleReviewSubmit = async (productId: string) => {
    const form = reviewForms[productId] || { rating: 5, title: "", message: "" };
    if (!form.title.trim() || !form.message.trim()) {
      alert("Please fill in both title and message for your review.");
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: form.rating,
          title: form.title,
          message: form.message
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to submit review");
      }
      setSubmittedReviews(prev => ({ ...prev, [productId]: true }));
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    }
  };

  if (checkoutCompleted) {
    return (
      <div className="mx-auto max-w-2xl w-full space-y-6 py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft space-y-4 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900">Checkout Completed!</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            {status || "Order placed successfully! Your order details have been recorded."}
          </p>
          {placedOrderId && (
            <div className="pt-2">
              <button
                onClick={() => window.open(`/api/orders/${placedOrderId}/invoice/download`, "_blank")}
                className="inline-flex items-center justify-center rounded-2xl bg-royal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-royal-700 cursor-pointer"
              >
                Download Invoice
              </button>
            </div>
          )}
          <div className="pt-4 flex justify-center gap-4">
            <a href="/" className="primary-btn font-semibold rounded-full px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white transition">Go to Home</a>
            <a href="/products" className="secondary-btn font-semibold rounded-full px-5 py-2.5 border border-slate-200 hover:bg-slate-50 transition">Browse more cards</a>
          </div>
        </div>

        {orderedItems.length > 0 && (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft space-y-6">
            <h4 className="text-xl font-bold text-slate-900">Leave a Review for your purchase</h4>
            <p className="text-sm text-slate-550">Your feedback helps others choose the best cards.</p>
            <div className="divide-y divide-slate-100">
              {(() => {
                const seenProducts = new Set<string>();
                const uniqueOrderedItems = orderedItems.filter((item) => {
                  const productId = item.productId || item.product?.id;
                  if (!productId || seenProducts.has(productId)) {
                    return false;
                  }
                  seenProducts.add(productId);
                  return true;
                });

                return uniqueOrderedItems.map((item) => {
                  const productId = item.productId || item.product?.id;
                  if (!productId) return null;
                  const isReviewed = submittedReviews[productId];
                  const form = reviewForms[productId] || { rating: 5, title: "", message: "" };

                  return (
                    <div key={productId} className="py-6 first:pt-0 last:pb-0 space-y-4">
                      <p className="font-semibold text-slate-800 text-sm">{item.product?.title || "Gift Card"}</p>
                      {isReviewed ? (
                        <p className="text-sm text-emerald-600 font-medium">✓ Thank you! Your review has been submitted.</p>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase">Rating</label>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewForms(prev => ({
                                    ...prev,
                                    [productId]: { ...(prev[productId] || { rating: 5, title: "", message: "" }), rating: star }
                                  }))}
                                  className={`text-xl transition ${star <= form.rating ? "text-amber-500" : "text-slate-300"}`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Review Title (e.g. Beautiful design!)"
                              value={form.title}
                              onChange={(e) => setReviewForms(prev => ({
                                ...prev,
                                [productId]: { ...(prev[productId] || { rating: 5, title: "", message: "" }), title: e.target.value }
                              }))}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none w-full"
                            />
                          </div>
                          <div>
                            <textarea
                              placeholder="Write your review message..."
                              value={form.message}
                              onChange={(e) => setReviewForms(prev => ({
                                ...prev,
                                [productId]: { ...(prev[productId] || { rating: 5, title: "", message: "" }), message: e.target.value }
                              }))}
                              rows={3}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none w-full"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleReviewSubmit(productId)}
                            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 transition"
                          >
                            Submit Review
                          </button>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={activeStep === 1 ? "grid gap-6 xl:grid-cols-[1fr_0.9fr]" : "mx-auto max-w-2xl w-full"}>
      <div className="space-y-4">
        {/* Step tabs */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { index: 1, label: "Review", icon: CheckCircle2 },
              { index: 2, label: "Verify", icon: ShieldCheck },
              { index: 3, label: "Pay", icon: CreditCard }
            ].map(({ index, label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveStep(index as 1 | 2 | 3)}
                className={
                  index === activeStep
                    ? "rounded-2xl border border-royal-200 bg-royal-50 px-4 py-3 text-left"
                    : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
                }
              >
                <Icon className={index === activeStep ? "h-5 w-5 text-royal-500" : "h-5 w-5 text-slate-400"} />
                <p className="mt-2 text-sm font-medium text-slate-900">{label}</p>
              </button>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-600">
            Review your gift card order, complete identity verification, and proceed to payment.
          </p>
        </div>

        {/* ── Step 1 — Order Review ─────────────────────────────────────── */}
        {activeStep === 1 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-2xl font-semibold text-slate-900">Order review</h3>

            {/* Cart items */}
            <div className="mt-4 space-y-3">
              {cartLoading ? (
                <p className="animate-pulse text-sm text-slate-400">Loading your cart…</p>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
                  <p className="font-medium text-amber-800">Your cart is empty</p>
                  <p className="mt-1 text-sm text-amber-600">Add a gift card first before checking out.</p>
                  <a href="/products" className="primary-btn mt-4 inline-block">Browse gift cards</a>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{item.product?.title ?? "Gift Card"}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        ₹{item.amount.toLocaleString("en-IN")} per card
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={cartActionId === item.id || item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[2rem] text-center font-medium text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={cartActionId === item.id || item.quantity >= 10}
                          aria-label="Increase quantity"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="min-w-[5rem] text-right font-semibold text-luxury-gold">
                        ₹{(item.amount * item.quantity).toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemoveItem(item.id)}
                        disabled={cartActionId === item.id}
                        aria-label="Remove item"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Delivery type selector */}
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700">Delivery type</p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDelivery("VIRTUAL")}
                  className={delivery === "VIRTUAL" ? "primary-btn flex-1" : "secondary-btn flex-1"}
                >
                  Virtual
                </button>
                <button
                  type="button"
                  onClick={() => setDelivery("PHYSICAL")}
                  className={delivery === "PHYSICAL" ? "primary-btn flex-1" : "secondary-btn flex-1"}
                >
                  Physical
                </button>
              </div>
            </div>

            {/* Address fields — only shown when Physical is selected */}
            {delivery === "PHYSICAL" ? (
              <div className="mt-5 grid gap-3">
                <p className="text-sm font-medium text-slate-700">Shipping address</p>

                <div>
                  <input
                    name="address-line1"
                    autoComplete="address-line1"
                    value={address.line1}
                    onChange={(e) => {
                      setAddress((a) => ({ ...a, line1: e.target.value }));
                      if (step1Errors.line1) setStep1Errors((p) => ({ ...p, line1: "" }));
                    }}
                    placeholder="Address line 1 *"
                    className={inputClass(!!step1Errors.line1)}
                  />
                  <FieldError msg={step1Errors.line1} />
                </div>

                <input
                  name="address-line2"
                  autoComplete="address-line2"
                  value={address.line2}
                  onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                  placeholder="Address line 2 (optional)"
                  className={inputClass(false)}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <select
                      name="city"
                      autoComplete="address-level2"
                      value={address.city}
                      onChange={(e) => {
                        const selectedCity = e.target.value;
                        const mapping = INDIAN_CITIES.find((c) => c.city === selectedCity);
                        setAddress((a) => ({
                          ...a,
                          city: selectedCity,
                          state: mapping ? mapping.state : a.state
                        }));
                        if (step1Errors.city) setStep1Errors((p) => ({ ...p, city: "" }));
                      }}
                      className={selectClass(!!step1Errors.city)}
                    >
                      <option value="" disabled>Select City *</option>
                      {INDIAN_CITIES.map((item) => (
                        <option key={item.city} value={item.city}>
                          {item.city}
                        </option>
                      ))}
                    </select>
                    <FieldError msg={step1Errors.city} />
                  </div>
                  <input
                    name="state"
                    autoComplete="address-level1"
                    value={address.state}
                    onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                    placeholder="State"
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 outline-none cursor-not-allowed w-full"
                    readOnly
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <input
                      name="postal-code"
                      autoComplete="postal-code"
                      value={address.postalCode}
                      onChange={(e) => {
                        setAddress((a) => ({ ...a, postalCode: e.target.value }));
                        if (step1Errors.postalCode) setStep1Errors((p) => ({ ...p, postalCode: "" }));
                      }}
                      placeholder="PIN code *"
                      maxLength={6}
                      className={inputClass(!!step1Errors.postalCode)}
                    />
                    <FieldError msg={step1Errors.postalCode} />
                  </div>
                  <input
                    name="country"
                    autoComplete="country"
                    value={address.country}
                    onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                    placeholder="Country"
                    className={inputClass(false)}
                  />
                </div>
              </div>
            ) : null}

            {/* Cardholder details: Name, Gender, DOB */}
            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700">Cardholder details</p>

              <div>
                <input
                  name="name"
                  autoComplete="name"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    if (step1Errors.recipientName) setStep1Errors((p) => ({ ...p, recipientName: "" }));
                  }}
                  placeholder="Cardholder Name *"
                  className={inputClass(!!step1Errors.recipientName)}
                />
                <FieldError msg={step1Errors.recipientName} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <select
                    name="sex"
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      if (step1Errors.gender) setStep1Errors((p) => ({ ...p, gender: "" }));
                    }}
                    className={selectClass(!!step1Errors.gender)}
                  >
                    <option value="" disabled>Select Gender *</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <FieldError msg={step1Errors.gender} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 sm:hidden">Date of Birth</label>
                  <input
                    name="bday"
                    type="date"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (step1Errors.dob) setStep1Errors((p) => ({ ...p, dob: "" }));
                    }}
                    className={inputClass(!!step1Errors.dob)}
                    placeholder="Date of Birth"
                  />
                  <FieldError msg={step1Errors.dob} />
                </div>
              </div>
            </div>

            {cardsRemaining !== null && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 text-sm">Yearly Card Limit</p>
                {cardsRemaining === Infinity ? (
                  <p className="mt-1 text-emerald-600 font-medium">Unlimited admin quota active.</p>
                ) : (
                  <p className="mt-1">
                    You have <strong className={cardsRemaining < 15 ? "text-red-650" : "text-royal-650"}>{cardsRemaining}</strong> cards remaining in your yearly limit of 100.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                if (!validateStep1()) return;

                try {
                  // Save address, DOB, and gender to user profile on the server
                  await updateProfile({
                    name: recipientName || undefined,
                    dob: dob || null,
                    gender: gender || null,
                    deliveryAddressLine1: address.line1 || null,
                    deliveryAddressLine2: address.line2 || null,
                    deliveryCity: address.city || null,
                    deliveryState: address.state || null,
                    deliveryPostalCode: address.postalCode || null,
                    deliveryCountry: address.country || "India"
                  });

                  // Refresh profile reference
                  const updatedUser = await getMe();
                  setProfileUser(updatedUser);

                  if (updatedUser.panVerifiedAt) {
                    setActiveStep(3); // Skip Step 2
                    return;
                  }
                } catch (e) {
                  console.warn("Failed to automatically save profile to server:", e);
                }

                if (profileUser?.panVerifiedAt) {
                  setActiveStep(3);
                } else {
                  setActiveStep(2);
                }
              }}
              disabled={items.length === 0 && !cartLoading}
              className="primary-btn mt-6 w-full disabled:opacity-50"
            >
              Continue to verification
            </button>

            {Object.keys(step1Errors).length > 0 && (
              <p className="mt-2 text-center text-xs text-red-600">
                Please fill in all required fields above before continuing.
              </p>
            )}
          </div>
        ) : null}

        {/* ── Step 2 — Identity Verification ───────────────────────────── */}
        {activeStep === 2 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-2xl font-semibold text-slate-900">Identity verification</h3>
            {profileUser?.panVerifiedAt ? (
              <div className="mt-5 space-y-6 text-center py-6 animate-fadeIn">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="h-10 w-10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-slate-950">Identity Already Verified</h4>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Your PAN and contact details have already been successfully verified. You don't need to verify them again.
                  </p>
                </div>
                
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 max-w-md mx-auto text-left space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="font-medium text-slate-500">Email:</span> {profileUser.email}
                  </div>
                  {profileUser.phone && (
                    <div>
                      <span className="font-medium text-slate-500">Mobile:</span> {profileUser.phone}
                    </div>
                  )}
                  {profileUser.panNumber && (
                    <div>
                      <span className="font-medium text-slate-500">PAN:</span> {profileUser.panNumber}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="primary-btn w-full max-w-md mx-auto block"
                >
                  Proceed to Payment
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                <div>
                  <input
                    name="tel"
                    autoComplete="tel"
                    value={verification.mobileNumber || ""}
                    onChange={(e) => {
                      setVerification((v) => ({ ...v, mobileNumber: e.target.value }));
                      if (step2Errors.mobileNumber) setStep2Errors((p) => ({ ...p, mobileNumber: "" }));
                      setOtpSent(false);
                    }}
                    placeholder="Mobile number *"
                    maxLength={10}
                    className={inputClass(!!step2Errors.mobileNumber)}
                  />
                  <FieldError msg={step2Errors.mobileNumber} />
                </div>

                {otpSent && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-200 animate-fadeIn space-y-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Mobile OTP *</label>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {mobileOtp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { mobileOtpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleMobileOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleMobileOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleMobileOtpPaste : undefined}
                          className={`h-12 w-10 sm:h-14 sm:w-12 rounded-2xl border text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-royal-400 focus:ring-2 focus:ring-royal-100 ${
                            mobileOtpError ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                          }`}
                        />
                      ))}
                    </div>
                    <FieldError msg={mobileOtpError} />
                  </div>
                )}

                <div>
                  <input
                    name="pan"
                    autoComplete="off"
                    value={verification.panNumber}
                    onChange={(e) => {
                      setVerification((v) => ({ ...v, panNumber: e.target.value.toUpperCase() }));
                      if (step2Errors.panNumber) setStep2Errors((p) => ({ ...p, panNumber: "" }));
                    }}
                    placeholder="PAN number *"
                    maxLength={10}
                    className={inputClass(!!step2Errors.panNumber)}
                  />
                  <FieldError msg={step2Errors.panNumber} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address (Verified at Login)</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={verification.email}
                    readOnly
                    disabled
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-400 bg-slate-50 cursor-not-allowed w-full"
                  />
                  <FieldError msg={step2Errors.email} />
                </div>

                {/* Email OTP removed - verified during login */}

                <button
                  type="button"
                  onClick={() => void (otpSent ? verifyDetailsAndOtps() : sendVerificationCodes())}
                  disabled={busy}
                  className="primary-btn mt-2"
                >
                  {busy ? "Processing…" : otpSent ? "Verify Details & OTP" : "Send Verification OTP"}
                </button>

                {otpSent && (
                  <p className="text-center text-xs text-slate-500 mt-1">
                    Tip: You can use the bypass code <strong className="font-semibold text-royal-650">123456</strong> for testing.
                  </p>
                )}

                {Object.keys(step2Errors).length > 0 && (
                  <p className="text-center text-xs text-red-600">
                    Please correct the highlighted fields before verifying.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Step 3 — Pay ─────────────────────────────────────────────── */}
        {activeStep === 3 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-2xl font-semibold text-slate-900">Final checkout</h3>
            <p className="mt-2 text-sm text-slate-600">
              Everything is ready. Submit to create the checkout session and continue into payment confirmation.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-medium">Delivery: </span>
              {delivery === "VIRTUAL" ? "Virtual (digital delivery)" : "Physical (shipped to address)"}
            </div>
            <button
              type="button"
              onClick={() => void continueCheckout()}
              disabled={busy}
              className="primary-btn mt-5 w-full"
            >
              {busy ? "Processing…" : "Continue to payment"}
            </button>
          </div>
        ) : null}

        {/* Status message for steps 2 & 3 */}
        {activeStep !== 1 && status ? (
          <div
            className={`rounded-[20px] border px-4 py-3 text-sm ${
              status.startsWith("❌")
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {status}
          </div>
        ) : null}
      </div>

      {/* Bill Summary sidebar — only rendered on activeStep 1 */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <BillSummary
            rows={summaryRows}
            subtotal={`₹${faceValue.toLocaleString("en-IN")}`}
            total={`₹${totalAmount.toLocaleString("en-IN")}`}
          />
          {status ? (
            <div
              className={`rounded-[20px] border px-4 py-3 text-sm ${
                status.startsWith("❌")
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {status}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
