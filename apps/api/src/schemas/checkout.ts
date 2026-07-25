import { z } from "zod";

export const checkoutSchema = z.object({
  body: z.object({
    addressId: z.string().uuid().optional(),
    address: z.object({
      label: z.string().min(2),
      line1: z.string().min(3),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      postalCode: z.string().min(4),
      country: z.string().default("India")
    }).optional(),
    deliveryMethod: z.enum(["VIRTUAL", "PHYSICAL"]),
    couponCode: z.string().optional(),
    emailOtpVerified: z.boolean(),
    smsOtpVerified: z.boolean(),
    captchaToken: z.string().min(1),
    paymentProvider: z.enum(["RAZORPAY", "CASHFREE", "PLACEHOLDER"]).default("PLACEHOLDER"),
    email: z.string().email().optional(),
    mobileNumber: z.string().optional(),
    cardHolderName: z.string().optional(),
    gender: z.string().optional(),
    dob: z.string().optional(),
    chosenCard: z.string().optional()
  })
});

export const webhookSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    eventType: z.string().min(1),
    paymentStatus: z.enum(["SUCCESS", "FAILED", "PENDING"]),
    provider: z.enum(["RAZORPAY", "CASHFREE", "PLACEHOLDER"]),
    signature: z.string().optional(),
    payload: z.record(z.any()).optional().default({})
  })
});
