import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().min(8).optional().or(z.literal("")),
    password: z.string().min(8)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

export const otpRequestSchema = z.object({
  body: z.object({
    purpose: z.enum(["SIGNUP", "LOGIN", "EMAIL_VERIFY", "SMS_VERIFY", "CHECKOUT", "PASSWORD_RESET"]),
    email: z.string().email().optional(),
    phone: z.string().optional()
  })
});

export const otpVerifySchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    code: z.string().length(6),
    purpose: z.enum(["SIGNUP", "LOGIN", "EMAIL_VERIFY", "SMS_VERIFY", "CHECKOUT", "PASSWORD_RESET"])
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6)
  })
});

export const panVerificationSchema = z.object({
  body: z.object({
    mobileNumber: z.string().trim().min(8, "Mobile number must be at least 8 digits"),
    panNumber: z.string().catch(""),
    email: z.string().trim().toLowerCase().email("Enter a valid email address")
  })
});
