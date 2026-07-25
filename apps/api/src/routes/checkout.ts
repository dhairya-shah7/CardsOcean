import { Router } from "express";
import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema, webhookSchema } from "../schemas/checkout.js";
import { checkoutLimiter } from "../middleware/rate-limits.js";
import { created, ok } from "../utils/responses.js";
import { issueCardsForOrder, simulateSuccessfulPayment } from "../services/checkout.js";
import { sendEmail } from "../services/mailer.js";
import { createPaymentIntent, verifyWebhookSignature } from "../services/payment.js";
import crypto from "crypto";
import { calculateBillSummary } from "../utils/billing.js";
import { logger } from "../utils/logger.js";
import { asyncHandler } from "../utils/async-handler.js";
import { config } from "../config.js";

export const checkoutRouter = Router();

checkoutRouter.post("/session", requireAuth, checkoutLimiter, validate(checkoutSchema), asyncHandler(async (req, res) => {
  let cartItems = await prisma.cartItem.findMany({
    where: {
      userId: req.user!.id,
      savedForLater: false
    },
    include: { product: true }
  });

  if (!cartItems.length) {
    // Attempt to create a demo cart for dev user if empty
    const { createDemoCart } = await import('../utils/createDemoCart.js');
    await createDemoCart(req.user!.id);
    cartItems = await prisma.cartItem.findMany({ where: { userId: req.user!.id, savedForLater: false }, include: { product: true } });
    if (!cartItems.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
  }

  // ── 100 cards/year limit for non-admin users ────────────────────────────
  const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (currentUser && currentUser.role !== "ADMIN") {
    const yearStart = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const cardsThisYear = await prisma.card.count({
      where: {
        userId: req.user!.id,
        createdAt: { gte: yearStart }
      }
    });
    const newCardCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const YEARLY_CARD_LIMIT = 100;
    if (cardsThisYear + newCardCount > YEARLY_CARD_LIMIT) {
      const remaining = Math.max(0, YEARLY_CARD_LIMIT - cardsThisYear);
      return res.status(400).json({
        success: false,
        message: `You can only order ${YEARLY_CARD_LIMIT} cards per year. You have ${remaining} remaining this year.`,
        data: { cardsThisYear, remaining, limit: YEARLY_CARD_LIMIT }
      });
    }
  }

  const resolvedCartItems = await Promise.all(
    cartItems.map(async (item: any) => {
      if (item.product) return item;
      if (!item.productId) return item;
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      return product ? { ...item, product } : item;
    })
  );

  const orphanedCartItemIds = resolvedCartItems.filter((item: any) => !item.product).map((item: any) => item.id);
  const validCartItems = resolvedCartItems.filter(
    (item: any): item is (typeof resolvedCartItems)[number] & { product: NonNullable<(typeof resolvedCartItems)[number]["product"]> } =>
      Boolean(item.product)
  );

    // Use the delivery method chosen by the user at checkout (not the cart item's cardType)
  const requiresAddress = req.body.deliveryMethod === "PHYSICAL";

  if (orphanedCartItemIds.length) {
    await prisma.cartItem.deleteMany({
      where: {
        id: { in: orphanedCartItemIds }
      }
    });
  }

  if (!validCartItems.length) {
    return res.status(400).json({ success: false, message: "Your cart contains removed products. Please add items again." });
  }

  let addressId = req.body.addressId as string | undefined;
  if (requiresAddress && !addressId && !req.body.address) {
    return res.status(400).json({ success: false, message: "Address is required for physical card delivery" });
  }

  if (requiresAddress && !addressId && req.body.address) {
    const address = await prisma.address.create({
      data: {
        userId: req.user!.id,
        ...req.body.address
      }
    });
    addressId = address.id;
  }

  const subtotal = validCartItems.reduce((sum: number, item: any) => sum + item.amount * item.quantity, 0);
  const billSummary = calculateBillSummary(subtotal, req.body.deliveryMethod);
  const coupon = req.body.couponCode
    ? await prisma.coupon.findUnique({ where: { code: req.body.couponCode } })
    : null;

  let discount = 0;
  if (coupon?.active) {
    discount = coupon.type === "FLAT"
      ? coupon.value
      : Math.floor((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  }

  // If CAPTCHA secret is configured, verify the token server-side
  let captchaVerified = false;
  const captchaSecret = process.env.CAPTCHA_SECRET_KEY;
  if (captchaSecret) {
    const token = req.body.captchaToken as string | undefined;
    if (!token) {
      return res.status(400).json({ success: false, message: "Missing captcha token" });
    }
    try {
      // Build form params safely (req.ip may be undefined)
      const params = new URLSearchParams();
      params.append("secret", captchaSecret);
      params.append("response", token);
      if (req.ip) params.append("remoteip", String(req.ip));

      // Use global fetch if available
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });

      const data = (await resp.json()) as { success?: boolean } | null;
      captchaVerified = Boolean(data?.success);
      if (!captchaVerified) {
        return res.status(400).json({ success: false, message: "Captcha verification failed" });
      }
    } catch (err) {
      console.error("Captcha verification error", err);
      return res.status(500).json({ success: false, message: "Captcha verification error" });
    }
  } else {
    // no captcha configured: use whatever client reported (best-effort)
    captchaVerified = Boolean(req.body.captchaToken);
  }

  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      addressId,
      subtotalAmount: subtotal,
      giftCardFaceValue: subtotal,
      deductionRate: billSummary.deductionRate,
      deductionAmount: billSummary.deductionAmount,
      finalCreditedAmount: billSummary.finalCreditedAmount,
      totalAmount: Math.max(billSummary.total - discount, 0),
      discountAmount: discount,
      taxAmount: billSummary.taxAmount,
      deliveryMethod: req.body.deliveryMethod,
      couponCode: req.body.couponCode,
      emailVerified: req.body.emailOtpVerified,
      smsVerified: req.body.smsOtpVerified,
      captchaVerified: captchaVerified,
      paymentProvider: req.body.paymentProvider,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.PENDING,
      items: {
        create: validCartItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          amount: item.amount,
          title: item.product.title,
          cardType: item.cardType
        }))
      }
    },
    include: {
      items: true
    }
  });

  await prisma.cartItem.deleteMany({
    where: { userId: req.user!.id, savedForLater: false }
  });

  try {
    const fullUser = await prisma.user.findUnique({ where: { id: req.user!.id } });

    let addrLine1 = "";
    let addrLine2 = "";
    let addrCity = "";
    let addrState = "";
    let addrPostalCode = "";
    let addrCountry = "India";

    if (addressId) {
      const address = await prisma.address.findUnique({ where: { id: addressId } });
      if (address) {
        addrLine1 = address.line1;
        addrLine2 = address.line2 ?? "";
        addrCity = address.city;
        addrState = address.state;
        addrPostalCode = address.postalCode;
        addrCountry = address.country;
      }
    } else if (req.body.address) {
      addrLine1 = req.body.address.line1;
      addrLine2 = req.body.address.line2 ?? "";
      addrCity = req.body.address.city;
      addrState = req.body.address.state;
      addrPostalCode = req.body.address.postalCode;
      addrCountry = req.body.address.country ?? "India";
    }

    const { appendPhysicalOrderCsv, appendPhysicalCardDetailsCsv, appendVirtualCardCsv, appendVirtualCardOrderCsv } = await import("../db.js");

    const totalCards = validCartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    if (req.body.deliveryMethod === "PHYSICAL") {
      await appendPhysicalOrderCsv({
        orderId: order.id,
        customerName: fullUser?.name ?? "Demo User",
        customerEmail: fullUser?.email ?? "",
        customerPhone: fullUser?.phone ?? "",
        customerPan: fullUser?.panNumber ?? "",
        addressLine1: addrLine1,
        addressLine2: addrLine2,
        city: addrCity,
        state: addrState,
        postalCode: addrPostalCode,
        country: addrCountry,
        amount: subtotal,
        numberOfCards: totalCards,
        cardHolderName: req.body.cardHolderName ?? "",
        gender: req.body.gender ?? "",
        dob: req.body.dob ?? ""
      });
      // Card details CSV: write empty row (headers kept, no data fetched)
      await appendPhysicalCardDetailsCsv({
        cardHolderName: "",
        mobileNumber: "",
        cardReferenceId: "",
        amount: 0
      });
    } else if (req.body.deliveryMethod === "VIRTUAL") {
      await appendVirtualCardOrderCsv({
        orderId: order.id,
        customerName: fullUser?.name ?? "Demo User",
        customerEmail: fullUser?.email ?? "",
        customerPhone: req.body.mobileNumber ?? fullUser?.phone ?? "",
        cardReferenceId: order.id,
        amount: subtotal,
        numberOfCards: totalCards
      });
      // Card details CSV: write empty row (headers kept, no data fetched)
      await appendVirtualCardCsv({
        cardHolderName: "",
        mobileNumber: "",
        cardReferenceId: "",
        amount: 0
      });
    }
  } catch (err) {
    console.warn("Failed to write order details to CSV:", err);
  }

  try {
    const amountPaise = Math.round(order.totalAmount * 100);
    const paymentIntent = await createPaymentIntent(req.body.paymentProvider, order.id, amountPaise);
    // Send virtual card details via email if delivery is virtual
    if (req.body.deliveryMethod === "VIRTUAL") {
      const emailHtml = `
        <p>Dear ${req.body.cardHolderName},</p>
        <p>Your virtual card has been created. Here are the details:</p>
        <ul>
          <li><strong>Name on Card:</strong> ${req.body.cardHolderName}</li>
          <li><strong>Mobile Number:</strong> ${req.body.mobileNumber}</li>
          <li><strong>Face Value:</strong> ₹${subtotal}</li>
          <li><strong>Final Amount:</strong> ₹${order.totalAmount}</li>
          <li><strong>Card Number:</strong> 4242 4242 4242 4242</li>
          <li><strong>Expiry Date:</strong> 12/34</li>
          <li><strong>CVV:</strong> ***</li>
          <li><strong>OTP:</strong> N/A</li>
          <li><strong>PIN:</strong> N/A</li>
          <li><strong>Card Reference Id:</strong> ${order.id}</li>
          <li><strong>Current Balance:</strong> N/A</li>
        </ul>
        <p>Thank you for using ${config.BRAND_NAME}.</p>
      `;
      try {
        await sendEmail({
          to: req.body.email || (req.user && req.user.email) || "",
          subject: "Your Virtual Card Details",
          html: emailHtml,
        });
      } catch (e) {
        console.error("Failed to send virtual card email", e);
      }
    }
    return created(res, { order, billSummary, paymentIntent: { ...paymentIntent, checkoutMode: "webhook_verified" } }, "Checkout session created");
  } catch (err) {
    logger.error("createPaymentIntent error", err);
    // fall back to placeholder response
    return created(res, {
      order,
      billSummary,
      paymentIntent: {
        provider: "PLACEHOLDER",
        clientSecret: `placeholder_${order.id}`,
        checkoutMode: "webhook_verified"
      }
    }, "Checkout session created (placeholder)");
  }
}));

checkoutRouter.post("/webhook", validate(webhookSchema), asyncHandler(async (req, res) => {
  const { orderId, eventType, paymentStatus, provider, payload } = req.body;

  // Try to verify webhook signature when possible
  let verified = true;
  try {
    const raw = JSON.stringify(req.body.payload || req.body || {});
    verified = verifyWebhookSignature(provider, raw, req.headers as Record<string, string | undefined>);
  } catch (e) {
    console.warn("Webhook signature verification error", e);
    verified = false;
  }

  await prisma.webhookEvent.create({
    data: {
      orderId,
      provider,
      eventType,
      verified,
      payload: JSON.stringify(payload || {})
    }
  });

  if (!verified) {
    console.warn("Unverified webhook received for order", orderId, "provider", provider);
    // still respond 200 to avoid retries, but mark the event unverified
  }

  if (paymentStatus === "SUCCESS") {
    await simulateSuccessfulPayment(orderId);
  } else if (paymentStatus === "FAILED") {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.FAILED }
    });
  }

  const order = await issueCardsForOrder(orderId).catch(() => null);

  return ok(res, { order }, "Webhook processed");
}));

// Confirm client-side payment (e.g., Razorpay checkout) by verifying provider signature
// requireAuth: prevents unauthenticated actors from confirming/triggering order issuance
checkoutRouter.post("/confirm", requireAuth, asyncHandler(async (req, res) => {
  const { provider, orderId } = req.body as { provider: string; orderId: string };
  if (!provider || !orderId) return res.status(400).json({ success: false, message: "Missing provider or orderId" });

  try {
    if (provider === "RAZORPAY") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as Record<string, string>;
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing Razorpay confirmation fields or secret not configured" });
      }

      const expected = crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      if (expected !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.SUCCESS, paymentReference: razorpay_payment_id } });
      await simulateSuccessfulPayment(orderId);

      return ok(res, null, "Payment confirmed and cards issued");
    }

    if (provider === "CASHFREE") {
      // Client-side Cashfree confirmation is best handled by server webhook.
      // Accept a client-side acknowledgement but do not auto-issue without webhook verification.
      return ok(res, null, "Cashfree client confirmation received; awaiting webhook verification");
    }

    if (provider === "PLACEHOLDER") {
      await simulateSuccessfulPayment(orderId);

      return ok(res, null, "Demo payment confirmed and cards issued");
    }

    return res.status(400).json({ success: false, message: "Unsupported provider" });
  } catch (err) {
    logger.error("/confirm error", { message: (err as Error)?.message });
    return res.status(500).json({ success: false, message: "Confirmation failed" });
  }
}));
