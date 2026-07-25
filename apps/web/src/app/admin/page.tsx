"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Activity,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  Download,
  Search,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowLeft,
  Settings
} from "lucide-react";
import {
  getMe,
  getAdminStats,
  getAuditLogs,
  getAdminProducts,
  updateProduct,
  getAdminUsers,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getAdminOrders,
  getApiUrl
} from "@/lib/api";

type Tab = "dashboard" | "logs" | "products" | "users" | "orders";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<"all" | "monthly" | "weekly">("all");
  // Audit Logs
  const [deviceLogs, setDeviceLogs] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState("");
  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  // Orders
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const user = await getMe();
        if (user.role !== "ADMIN" && user.role !== "MANAGER") {
          setError("Access Denied: Admin/Manager role required.");
          setLoading(false);
          return;
        }
        setCurrentUser(user);

        // Fetch initial tab data
        await refreshData("dashboard");
      } catch (err: any) {
        setError(err.message || "Failed to load admin panel.");
      } finally {
        setLoading(false);
      }
    }
    void loadAdminData();
  }, []);

  const refreshData = async (tab: Tab) => {
    try {
      if (tab === "dashboard") {
        const s = await getAdminStats();
        setStats(s);
      } else if (tab === "logs") {
        const { deviceLogs, adminLogs } = await getAuditLogs();
        setDeviceLogs(deviceLogs || []);
        setAdminLogs(adminLogs || []);
      } else if (tab === "products") {
        const p = await getAdminProducts();
        setProducts(p);
      } else if (tab === "users") {
        const u = await getAdminUsers();
        setUsers(u);
      } else if (tab === "orders") {
        const o = await getAdminOrders();
        setOrders(o);
      }
    } catch (err: any) {
      console.error(`Failed to refresh ${tab} data:`, err);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    void refreshData(tab);
  };

  // Product actions
  const handleEditProductClick = (product: any) => {
    setEditingProduct({ ...product });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const { id, slug, createdAt, updatedAt, ...updatable } = editingProduct;
      // Convert numbers
      updatable.minAmount = Number(updatable.minAmount);
      updatable.maxAmount = Number(updatable.maxAmount);
      await updateProduct(id, updatable);
      setEditingProduct(null);
      await refreshData("products");
    } catch (err: any) {
      alert("Failed to update product: " + err.message);
    }
  };

  // User actions
  const handleToggleSuspend = async (user: any) => {
    try {
      if (user.accountSuspended) {
        await unsuspendUser(user.id);
      } else {
        await suspendUser(user.id);
      }
      await refreshData("users");
    } catch (err: any) {
      alert("Failed to update user status: " + err.message);
    }
  };

  const handleToggleRole = async (user: any) => {
    try {
      const nextRole = user.role === "USER" ? "MANAGER" : user.role === "MANAGER" ? "ADMIN" : "USER";
      await updateUserRole(user.id, nextRole);
      await refreshData("users");
    } catch (err: any) {
      alert("Failed to update user role: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
    try {
      await deleteUser(userId);
      await refreshData("users");
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-royal-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-glow">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Access Denied</h1>
        <p className="mt-4 text-slate-600">This area is reserved for administrators only. Unauthorized access has been logged.</p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Safety
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="glass-card mb-8 rounded-[32px] p-6 shadow-glow border border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-royal-600">Admin Control Center</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {(typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_NAME) || "Cards Ocean"} Management Console
            </h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back, {currentUser?.name}. Accessing from {typeof window !== "undefined" ? window.location.hostname : ""}.</p>
          </div>
          <button
            onClick={() => void refreshData(activeTab)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 mb-8">
        {(["dashboard", "logs", "products", "users", "orders"] as Tab[])
          .filter((tab) => currentUser?.role === "ADMIN" || tab !== "products")
          .map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? "bg-royal-600 text-white shadow-glow"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Dashboard */}
      {activeTab === "dashboard" && stats && (
        <div className="space-y-8 animate-fadeIn">
          {/* Filter Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">Overview Metrics</h2>
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start">
              {(["all", "monthly", "weekly"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    timeFilter === filter
                      ? "bg-white text-royal-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {filter === "all" ? "Total" : filter === "monthly" ? "30 Days" : "7 Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-3xl p-6 border border-slate-100 bg-white/60">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-royal-600" />
                <span className="rounded-full bg-royal-50 px-2 py-1 text-xs font-medium text-royal-600">All-time</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 font-medium">Registered Users</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            </div>
            <div className="glass-card rounded-3xl p-6 border border-slate-100 bg-white/60">
              <div className="flex items-center justify-between">
                <ShoppingCart className="h-8 w-8 text-indigo-600" />
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">All-time</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 font-medium">Orders Processed</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="glass-card rounded-3xl p-6 border border-slate-100 bg-white/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                  {timeFilter === "all" ? "All-time" : timeFilter === "monthly" ? "30 Days" : "7 Days"}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500 font-medium">
                {timeFilter === "all" ? "Total Volume" : timeFilter === "monthly" ? "Monthly Volume" : "Weekly Volume"}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                ₹{timeFilter === "all"
                  ? stats.totalRevenue.toLocaleString()
                  : timeFilter === "monthly"
                  ? stats.monthlyRevenue.toLocaleString()
                  : stats.weeklyRevenue.toLocaleString()}
              </p>
            </div>
            <div className="glass-card rounded-3xl p-6 border border-slate-100 bg-white/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <CreditCard className="h-8 w-8 text-violet-600" />
                <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-600">
                  {timeFilter === "all" ? "All-time" : timeFilter === "monthly" ? "30 Days" : "7 Days"}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500 font-medium">
                {timeFilter === "all" ? "Cards Ordered (Total)" : timeFilter === "monthly" ? "Cards Ordered (30d)" : "Cards Ordered (7d)"}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {timeFilter === "all"
                  ? (stats.totalCards ?? stats.cardsThisMonth ?? 0)
                  : timeFilter === "monthly"
                  ? (stats.monthlyCards ?? stats.cardsThisMonth ?? 0)
                  : (stats.weeklyCards ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="glass-card rounded-[32px] p-6 border border-slate-100 bg-white/60 lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-royal-600" /> System Activity Overview
              </h2>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <h3 className="font-semibold text-slate-800 text-sm">Security & Access Checks</h3>
                  <p className="text-xs text-slate-500 mt-1">All sensitive operations require RBAC check. Active user sessions are continuously audited.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <h3 className="font-semibold text-slate-800 text-sm">Automated CSV Synchronization</h3>
                  <p className="text-xs text-slate-500 mt-1">Fulfillment CSV files are synced immediately upon order confirmations to the storage node.</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-[32px] p-6 border border-slate-100 bg-white/60">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Quick Actions
              </h2>
              <div className="grid gap-3">
                <button
                  onClick={() => handleTabChange("logs")}
                  className="w-full text-left rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition"
                >
                  <p className="text-xs font-semibold text-royal-600">Audit</p>
                  <p className="text-sm font-bold text-slate-800">Verify User Activity Logs</p>
                </button>
                <button
                  onClick={() => handleTabChange("users")}
                  className="w-full text-left rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition"
                >
                  <p className="text-xs font-semibold text-royal-600">Users</p>
                  <p className="text-sm font-bold text-slate-800">Manage Suspended Users</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit actions, user email, or ip..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500"
              />
            </div>
            <a
              href={`${getApiUrl()}/api/admin/audit-logs/csv`}
              download
              className="inline-flex items-center justify-center gap-2 rounded-full bg-royal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-royal-700"
            >
              <Download className="h-4 w-4" /> Download Audit CSV
            </a>
          </div>

          <div className="glass-card rounded-[32px] overflow-hidden border border-slate-100 bg-white/70">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-55/30 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">User / Email</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">IP / Agent</th>
                    <th className="px-6 py-4">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {/* Merge and Filter logs */}
                  {[
                    ...deviceLogs.map(l => ({ ...l, logType: "USER" })),
                    ...adminLogs.map(l => ({ ...l, logType: "ADMIN" }))
                  ]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .filter(log => {
                      const searchStr = `${log.action} ${log.user?.email || log.actor?.email || ""} ${log.ipAddress || ""}`.toLowerCase();
                      return searchStr.includes(logSearch.toLowerCase());
                    })
                    .slice(0, 50)
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            log.logType === "ADMIN" ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            {log.logType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{log.user?.name || log.actor?.name || "Guest"}</p>
                          <p className="text-xs text-slate-500">{log.user?.email || log.actor?.email || ""}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          <p>{log.ipAddress || "N/A"}</p>
                          <p className="max-w-xs truncate" title={log.userAgent}>{log.userAgent || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600 font-mono" title={log.metadata || `Target ID: ${log.targetId}`}>
                          {log.metadata || (log.targetType ? `${log.targetType}: ${log.targetId}` : "")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Products */}
      {activeTab === "products" && (
        <div className="space-y-6 animate-fadeIn">
          {editingProduct ? (
            <div className="glass-card rounded-[32px] p-8 border border-slate-100 bg-white/70 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Gift Card details</h2>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Card Title</label>
                    <input
                      type="text"
                      value={editingProduct.title || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-royal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Subtitle</label>
                    <input
                      type="text"
                      value={editingProduct.subtitle || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-royal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Description</label>
                  <textarea
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    required
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-royal-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Min Price (₹)</label>
                    <input
                      type="number"
                      value={editingProduct.minAmount || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, minAmount: e.target.value })}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-royal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Max Price (₹)</label>
                    <input
                      type="number"
                      value={editingProduct.maxAmount || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, maxAmount: e.target.value })}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-royal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Delivery Type</label>
                    <select
                      value={editingProduct.type || "VIRTUAL"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-royal-500"
                    >
                      <option value="VIRTUAL">VIRTUAL</option>
                      <option value="PHYSICAL">PHYSICAL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Photo / Image URL</label>
                  <input
                    type="text"
                    value={editingProduct.image || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-royal-500"
                  />
                </div>

                <div className="flex gap-6 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.featured || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-350 text-royal-600 focus:ring-royal-500"
                    />
                    <span className="text-sm text-slate-700 font-medium">Featured Product</span>
                  </label>
                  <div>
                    <label className="text-sm text-slate-700 font-medium mr-2">Product Status:</label>
                    <select
                      value={editingProduct.status || "APPROVED"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-royal-500"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-royal-600 px-6 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-royal-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="glass-card rounded-[32px] overflow-hidden border border-slate-100 bg-white/70 flex flex-col">
                  <div className="relative h-48 w-full bg-slate-100">
                    <img
                      src={product.image || "https://images.unsplash.com/photo-1556740758-90de374c12ad"}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                    <span className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      product.status === "APPROVED" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {product.status}
                    </span>
                    <span className="absolute left-4 top-4 rounded-full bg-slate-900/65 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                      {product.type}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{product.title}</h3>
                      <p className="mt-1 text-xs text-slate-400 font-semibold">{product.subtitle}</p>
                      <p className="mt-3 text-sm text-slate-500 line-clamp-2">{product.description}</p>
                      <div className="mt-4 flex gap-4 text-xs font-bold text-slate-700">
                        <p>Min: ₹{product.minAmount}</p>
                        <p>Max: ₹{product.maxAmount}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-royal-600">
                        {product.featured ? "★ Featured" : ""}
                      </span>
                      <button
                        onClick={() => handleEditProductClick(product)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-royal-600 transition"
                      >
                        <Edit2 className="h-4 w-4" /> Edit Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-royal-500"
            />
          </div>

          <div className="glass-card rounded-[32px] overflow-hidden border border-slate-100 bg-white/70">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-55/30 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {users
                    .filter((user) => {
                      const searchStr = `${user.name} ${user.email} ${user.role}`.toLowerCase();
                      return searchStr.includes(userSearch.toLowerCase());
                    })
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          {u.phone && <p className="text-xs text-slate-400 mt-0.5">Ph: {u.phone}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider ${
                            u.role === "ADMIN" ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-100 text-slate-700"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider ${
                            u.accountSuspended ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                          }`}>
                            {u.accountSuspended ? "SUSPENDED" : "ACTIVE"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                          <p>{u.panNumber ? `PAN: ${u.panNumber}` : "PAN: Not set"}</p>
                          <p className="text-slate-400">{u.panVerifiedAt ? "Verified" : "Not Verified"}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentUser?.role === "ADMIN" ? (
                              <select
                                value={u.role}
                                onChange={async (e) => {
                                  const nextRole = e.target.value;
                                  try {
                                    await updateUserRole(u.id, nextRole);
                                    await refreshData("users");
                                  } catch (err: any) {
                                    alert("Failed to update user role: " + err.message);
                                  }
                                }}
                                disabled={u.id === currentUser?.id}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-royal-500 focus:outline-none disabled:opacity-50"
                                title="Change user role"
                              >
                                <option value="USER">USER</option>
                                <option value="MANAGER">MANAGER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No access</span>
                            )}
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              disabled={u.id === currentUser?.id}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                                u.accountSuspended
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                              title={u.accountSuspended ? "Unsuspend account" : "Suspend account"}
                            >
                              {u.accountSuspended ? "Unsuspend" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === currentUser?.id}
                              className="rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card rounded-[32px] overflow-hidden border border-slate-100 bg-white/70">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-55/30 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Order ID / Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items Ordered</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Delivery Method</th>
                    <th className="px-6 py-4">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-mono text-xs font-semibold text-slate-800">{order.id.slice(0, 8)}...</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{order.user?.name || "Demo User"}</p>
                        <p className="text-xs text-slate-500">{order.user?.email || ""}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(order.items || []).map((item: any) => (
                            <p key={item.id} className="text-xs">
                              <span className="font-semibold">{item.quantity}x</span> {item.title || "Gift Card"} (₹{item.amount})
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          order.paymentStatus === "SUCCESS" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 uppercase font-semibold">
                        {order.deliveryMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          order.deliveryStatus === "DELIVERED" ? "bg-blue-500 text-white" : "bg-slate-400 text-white"
                        }`}>
                          {order.deliveryStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
