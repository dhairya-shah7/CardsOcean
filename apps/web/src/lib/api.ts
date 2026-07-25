import type { BrandConfig, Card, CartItem, Order, Product, Review } from "./types";

export function getApiUrl(): string {
  // Browser requests go through the Next.js /api rewrite (same origin).
  if (typeof window !== "undefined") {
    return "";
  }

  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.VITE_API_URL ??
    "http://localhost:4000"
  );
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }

  return payload.data;
}

export async function getBrand(): Promise<BrandConfig> {
  try {
    return await request<BrandConfig>("/api/meta/brand");
  } catch {
    return {
      name: process.env.NEXT_PUBLIC_APP_NAME ?? "Cards Ocean",
      logoUrl: process.env.NEXT_PUBLIC_LOGO_URL ?? "",
      tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE ?? ""
    };
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return request<Product[]>("/api/products/featured/list");
}

export async function getProducts(searchParams?: Record<string, string | undefined>): Promise<Product[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return request<Product[]>(`/api/products${query ? `?${query}` : ""}`);
}

export async function getProductBySlug(slug: string): Promise<Product & { reviews?: Review[] }> {
  return request<Product & { reviews?: Review[] }>(`/api/products/${slug}`);
}

export async function getCartItems(): Promise<CartItem[]> {
  return request<CartItem[]>("/api/cart");
}

export async function updateCartItem(
  id: string,
  body: { quantity?: number; amount?: number; savedForLater?: boolean }
): Promise<CartItem> {
  return request<CartItem>(`/api/cart/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function removeCartItem(id: string): Promise<void> {
  await request<null>(`/api/cart/items/${id}`, { method: "DELETE" });
}

export async function getOrders(): Promise<Order[]> {
  return request<Order[]>("/api/orders");
}

export async function getCards(): Promise<Card[]> {
  return request<Card[]>("/api/cards");
}

export async function getMe() {
  return request<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    panNumber?: string | null;
    panVerifiedAt?: string | null;
    dob?: string | null;
    gender?: string | null;
    deliveryAddressLine1?: string | null;
    deliveryAddressLine2?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    deliveryPostalCode?: string | null;
    deliveryCountry?: string | null;
  }>("/api/auth/me");
}

export async function updateProfile(body: {
  name?: string;
  phone?: string | null;
  email?: string;
  dob?: string | null;
  gender?: string | null;
  deliveryAddressLine1?: string | null;
  deliveryAddressLine2?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryPostalCode?: string | null;
  deliveryCountry?: string | null;
}) {
  return request<any>("/api/settings/profile", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function logout(): Promise<void> {
  const apiBase = getApiUrl();
  await fetch(`${apiBase}/api/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
}

// ── Admin API Helpers ────────────────────────────────────────────────────────

export async function getAdminOverview(): Promise<any> {
  return request<any>("/api/admin/overview");
}

export async function getAdminUsers(): Promise<any[]> {
  return request<any[]>("/api/admin/users");
}

export async function getAdminOrders(): Promise<any[]> {
  return request<any[]>("/api/admin/orders");
}

export async function getAdminTransactions(): Promise<any[]> {
  return request<any[]>("/api/admin/transactions");
}

export async function updateUserRole(userId: string, role: string): Promise<any> {
  return request<any>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });
}

export async function updateUserFlags(userId: string, body: { flagged?: boolean; suspended?: boolean }): Promise<any> {
  return request<any>(`/api/admin/users/${userId}/flags`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function suspendUser(userId: string): Promise<any> {
  return request<any>(`/api/admin/users/${userId}/suspend`, {
    method: "PATCH"
  });
}

export async function unsuspendUser(userId: string): Promise<any> {
  return request<any>(`/api/admin/users/${userId}/unsuspend`, {
    method: "PATCH"
  });
}

export async function deleteUser(userId: string): Promise<any> {
  return request<any>(`/api/admin/users/${userId}`, {
    method: "DELETE"
  });
}

export async function getAuditLogs(): Promise<any> {
  return request<any>("/api/admin/audit-logs");
}

export async function getAdminProducts(): Promise<any[]> {
  return request<any[]>("/api/admin/products");
}

export async function updateProduct(productId: string, body: any): Promise<any> {
  return request<any>(`/api/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function getAdminStats(): Promise<any> {
  return request<any>("/api/admin/stats");
}

export async function emailInvoice(orderId: string): Promise<any> {
  return request<any>(`/api/orders/${orderId}/invoice/email`, {
    method: "POST"
  });
}
