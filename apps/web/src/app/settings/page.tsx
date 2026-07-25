"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { getMe, updateProfile } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const u = await getMe();
        if (cancelled) return;
        setUser(u);
        
        // Populate states
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setGender(u.gender || "");
        setDob(u.dob || "");
        setLine1(u.deliveryAddressLine1 || "");
        setLine2(u.deliveryAddressLine2 || "");
        setCity(u.deliveryCity || "");
        setState(u.deliveryState || "");
        setPostalCode(u.deliveryPostalCode || "");
        setCountry(u.deliveryCountry || "India");
      } catch (err) {
        if (!cancelled) {
          router.push("/login?redirect=/settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadUser();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Simple validations
    if (!name.trim()) {
      setErrorMsg("Name is required.");
      setSaving(false);
      return;
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number starting with 6-9.");
      setSaving(false);
      return;
    }
    if (postalCode && !/^\d{6}$/.test(postalCode)) {
      setErrorMsg("PIN code must be a 6-digit numeric value.");
      setSaving(false);
      return;
    }

    try {
      const updated = await updateProfile({
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email.trim().toLowerCase(),
        dob: dob || null,
        gender: gender || null,
        deliveryAddressLine1: line1 ? line1.trim() : null,
        deliveryAddressLine2: line2 ? line2.trim() : null,
        deliveryCity: city || null,
        deliveryState: state || null,
        deliveryPostalCode: postalCode ? postalCode.trim() : null,
        deliveryCountry: country ? country.trim() : "India"
      });
      
      setUser(updated);
      setSuccessMsg("Profile settings updated successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-royal-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Retrieving your profile settings...</p>
        </div>
      </main>
    );
  }

  const isEmailVerified = !!user?.emailVerifiedAt;
  const isPhoneVerified = !!(user?.panVerifiedAt || user?.phoneVerifiedAt);
  const isPanVerified = !!user?.panVerifiedAt;
  const isAdmin = user?.role === "ADMIN";
  const isEmailDisabled = isEmailVerified && !isAdmin;
  const isPhoneDisabled = isPhoneVerified && !isAdmin;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Top Heading */}
      <div className="space-y-3 mb-10">
        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-royal-600">Account Control Panel</p>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Profile &amp; Settings</h1>
        <p className="text-slate-600 max-w-2xl">
          Manage your personal details, secure your identity, and set delivery destinations for physical cards.
        </p>
      </div>

      {/* Verification Summary Banner */}
      {!(isEmailVerified && isPhoneVerified && isPanVerified) && (
        <div className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-royal-100 flex items-center justify-center text-royal-600">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Verification Profile</h3>
              <p className="text-xs text-slate-500">Your account needs complete verification for physical purchases and higher checkout limits.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all duration-300",
              isEmailVerified 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-amber-50 border-amber-200 text-amber-700"
            )}>
              {isEmailVerified ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              Email: {isEmailVerified ? "Verified" : "Pending"}
            </div>

            <div className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all duration-300",
              isPhoneVerified 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-amber-50 border-amber-200 text-amber-700"
            )}>
              {isPhoneVerified ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              Mobile: {isPhoneVerified ? "Verified" : "Pending"}
            </div>

            <div className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all duration-300",
              isPanVerified 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-amber-50 border-amber-200 text-amber-700"
            )}>
              {isPanVerified ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              PAN: {isPanVerified ? "Verified" : "Pending"}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Status Alerts */}
        {successMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-semibold text-emerald-800 flex items-center gap-3 animate-fadeIn">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm font-semibold text-red-800 flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Personal details */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-royal-500"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-royal-50 flex items-center justify-center text-royal-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Personal Identification</h2>
                  <p className="text-xs text-slate-500">Verify your primary details and name alignment.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200"
                      placeholder="Jane Doe"
                      required
                    />
                    <UserIcon className="absolute left-4 top-[15px] h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      <span>Email Address</span>
                      {isEmailDisabled && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md lowercase tracking-normal">
                          <ShieldCheck className="h-3 w-3 inline" /> immutable
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                          "w-full rounded-2xl border border-slate-200 px-4 py-3.5 pl-11 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200",
                          isEmailDisabled && "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                        )}
                        placeholder="email@example.com"
                        disabled={isEmailDisabled}
                        required
                      />
                      <Mail className="absolute left-4 top-[15px] h-5 w-5 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      <span>Mobile Number</span>
                      {isPhoneDisabled && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md lowercase tracking-normal">
                          <ShieldCheck className="h-3 w-3 inline" /> immutable
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={cn(
                          "w-full rounded-2xl border border-slate-200 px-4 py-3.5 pl-11 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200",
                          isPhoneDisabled && "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                        )}
                        placeholder="Mobile"
                        maxLength={10}
                        disabled={isPhoneDisabled}
                      />
                      <Phone className="absolute left-4 top-[15px] h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200 appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Date of Birth</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200"
                      />
                      <Calendar className="absolute left-4 top-[15px] h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-royal-500"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-royal-50 flex items-center justify-center text-royal-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Default Shipping Address</h2>
                  <p className="text-xs text-slate-500">Specified location for physical card shipments.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Address Line 1</label>
                  <input
                    type="text"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200"
                    placeholder="Street, area, colony, nearby landmark, etc."
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">City</label>
                    <select
                      value={city}
                      onChange={(e) => {
                        const selectedCity = e.target.value;
                        const mapping = INDIAN_CITIES.find((c) => c.city === selectedCity);
                        setCity(selectedCity);
                        if (mapping) {
                          setState(mapping.state);
                        } else {
                          setState("");
                        }
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200"
                    >
                      <option value="">Select City</option>
                      {INDIAN_CITIES.map((item) => (
                        <option key={item.city} value={item.city}>
                          {item.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">State</label>
                    <input
                      type="text"
                      value={state}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-slate-500 outline-none cursor-not-allowed"
                      placeholder="Auto-filled from City"
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">PIN Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200"
                      placeholder="6-digit PIN Code"
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-all duration-200"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sidebar / Meta / Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-royal-500"></div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">Save Changes</h3>
              <p className="text-xs text-slate-500 mb-6">
                All edits are immediately synced with our secure central servers. Immutable fields cannot be modified.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full primary-btn py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-all duration-200 disabled:opacity-50 hover:shadow-lg"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-3xl border border-royal-100 bg-royal-50/50 p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-royal-900 uppercase tracking-wider mb-3">Security &amp; Privacy</h3>
              <ul className="space-y-3.5 text-xs text-slate-600">
                <li className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-royal-500 mt-1.5 shrink-0"></div>
                  <span>Once PAN and email are verified, they become immutable to prevent identity-theft and account takeover attempts.</span>
                </li>
                <li className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-royal-500 mt-1.5 shrink-0"></div>
                  <span>We encrypt all PII data at rest. PAN data is never logged or exposed in raw formats.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
