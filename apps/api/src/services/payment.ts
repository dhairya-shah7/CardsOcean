import crypto from "crypto";
import { config } from "../config.js";

type CreateIntentResult = {
  provider: string;
  clientSecret: string;
  raw?: any;
};

export async function createPaymentIntent(provider: string, orderId: string, amount: number): Promise<CreateIntentResult> {
  if (provider === "RAZORPAY") {
    // amount is expected in smallest currency unit (paise)
    const keyId = process.env.RAZORPAY_KEY_ID;
    let keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId && keySecret && keySecret.includes(":")) {
      const [k, s] = keySecret.split(":", 2);
      keySecret = s;
      // if keyId is missing but keySecret contained both, set keyId
      // eslint-disable-next-line no-param-reassign
      process.env.RAZORPAY_KEY_ID = k;
    }

    if (!process.env.RAZORPAY_KEY_ID || !keySecret) {
      throw new Error("Razorpay credentials not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
    }

    const body = {
      amount: Math.round(amount),
      currency: "INR",
      receipt: orderId,
      payment_capture: 1
    };

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${keySecret}`).toString("base64")}`
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Razorpay order creation failed: ${resp.status} ${text}`);
    }

    const data = (await resp.json()) as any;
    // Return order id as clientSecret for frontend to use with Razorpay SDK
    return { provider: "RAZORPAY", clientSecret: data.id, raw: data };
  }

  if (provider === "CASHFREE") {
    // Cashfree PG order creation
    const clientId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_SECRET || process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Cashfree credentials not configured (CASHFREE_APP_ID / CASHFREE_SECRET)");
    }

    // Cashfree expects amount in rupees (decimal). Input `amount` is paise.
    const orderAmount = (Number(amount) / 100).toFixed(2);

    const body = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        // minimal customer placeholder; frontend should send real details in future
        customer_id: `user_${orderId}`,
        customer_email: process.env.SENDER_EMAIL || "no-reply@localhost",
        customer_phone: process.env.DEFAULT_PHONE || ""
      }
    };

    const resp = await fetch("https://api.cashfree.com/pg/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`Cashfree order creation failed: ${resp.status} ${txt}`);
    }

    const data = (await resp.json()) as any;
    // Cashfree returns a `sub` or `order_token` depending on API; expose raw to frontend
    return { provider: "CASHFREE", clientSecret: data.order_token ?? data.sub ?? `cashfree_${orderId}`, raw: data };
  }

  // PLACEHOLDER: fallback behavior
  return { provider: "PLACEHOLDER", clientSecret: `placeholder_${orderId}` };
}

export function verifyWebhookSignature(provider: string, rawBody: string, headers: Record<string, string | undefined>): boolean {
  try {
    if (provider === "RAZORPAY") {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const signature = headers["x-razorpay-signature"] || headers["x-razorpay_signature"];
      if (!secret || !signature) return false;
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      return expected === signature;
    }

    if (provider === "CASHFREE") {
      const secret = process.env.CASHFREE_SECRET;
      const signature = headers["x-webhook-signature"] || headers["x-cashfree-signature"];
      if (!secret || !signature) return false;
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      return expected === signature;
    }

    return false;
  } catch (err) {
    console.error("verifyWebhookSignature error", err);
    return false;
  }
}

export default { createPaymentIntent, verifyWebhookSignature };
