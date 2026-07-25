import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { OtpPurpose, Role } from "@prisma/client";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { forgotPasswordSchema, loginSchema, otpRequestSchema, otpVerifySchema, signupSchema, verifyEmailSchema } from "../schemas/auth.js";
import { created, ok } from "../utils/responses.js";
import { signToken } from "../utils/jwt.js";
import { generateOtp } from "../utils/otp.js";
import { sendEmail, sendSms } from "../services/mailer.js";
import { config } from "../config.js";
import { loginLimiter, otpIpLimiter, otpUserLimiter, signupLimiter } from "../middleware/rate-limits.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

export const authRouter = Router();

function sanitizeUser<T extends { password?: string }>(user: T | null | undefined) {
  if (!user) {
    return user;
  }

  const { password, ...safeUser } = user as T & { password?: string };
  return safeUser;
}

async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const code = generateOtp();

  await prisma.otpCode.updateMany({
    where: {
      purpose: OtpPurpose.EMAIL_VERIFY,
      email: user.email,
      consumedAt: null
    },
    data: { consumedAt: new Date() }
  });

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      email: user.email,
      purpose: OtpPurpose.EMAIL_VERIFY,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  });

  const delivered = await sendEmail({
    to: user.email,
    subject: `Verify your ${config.BRAND_NAME} email`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Welcome to ${config.BRAND_NAME}. Your email verification code is:</p>
      <p><strong>${code}</strong></p>
      <p>Enter this code on the verification page to activate your account.</p>
      <p><a href="${config.FRONTEND_URL}/verify-email?email=${encodeURIComponent(user.email)}">Open the verification page</a></p>
    `
  });

  return { code, delivered };
}

async function registerHandler(req: Request, res: Response) {
  const { name, email, phone, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12); // cost 12 for better brute-force resistance

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      verified: false,
      role: Role.USER
    }
  });

  const verification = await sendVerificationEmail(user);

  return created(
    res,
    {
      user: sanitizeUser(user),
      verificationCode: config.NODE_ENV === "development" ? verification.code : undefined,
      verificationEmailSent: verification.delivered
    },
    "Account created. Check your email to verify your account."
  );
}

authRouter.post("/signup", signupLimiter, validate(signupSchema), registerHandler);
authRouter.post("/register", signupLimiter, validate(signupSchema), registerHandler);

authRouter.post("/login", loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  if (user.accountSuspended) {
    return res.status(403).json({ success: false, message: "Account suspended" });
  }
  if (!user.verified) {
    return res.status(403).json({ success: false, message: "Please verify your email before signing in" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    domain: config.COOKIE_DOMAIN !== "localhost" ? config.COOKIE_DOMAIN : undefined
  });

  return ok(res, { user: sanitizeUser(user) }, "Logged in");
}));

authRouter.post("/logout", asyncHandler(async (req, res) => {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const SESSIONS_FILE = path.resolve(".generated/db/ip_sessions.json");
    if (fs.existsSync(SESSIONS_FILE)) {
      const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
      const forwarded = req.headers["x-forwarded-for"];
      const ip = forwarded ? String(forwarded).split(",")[0].trim() : (req.ip || req.socket.remoteAddress || "127.0.0.1");
      delete sessions[ip];
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
    }
  } catch (e) {
    // ignore
  }

  res.clearCookie("session", {
    domain: config.COOKIE_DOMAIN !== "localhost" ? config.COOKIE_DOMAIN : undefined
  });
  return ok(res, null, "Logged out");
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      addresses: true
    }
  });
  return ok(res, sanitizeUser(user));
}));

async function otpRequestHandler(req: Request, res: Response) {
  const { email, phone, purpose } = req.body;
  const code = generateOtp();
  const targetEmail = email || undefined;
  const targetPhone = phone || undefined;

  await prisma.otpCode.updateMany({
    where: {
      purpose: purpose as OtpPurpose,
      email: targetEmail,
      phone: targetPhone,
      consumedAt: null
    },
    data: { consumedAt: new Date() }
  });

  await prisma.otpCode.create({
    data: {
      email: targetEmail,
      phone: targetPhone,
      purpose: purpose as OtpPurpose,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  if (targetEmail) {
    await sendEmail({
      to: targetEmail,
      subject: `${config.BRAND_NAME} verification code`,
      html: `<p>Your verification code is <strong>${code}</strong></p>`
    });
  }

  if (targetPhone) {
    await sendSms({
      to: targetPhone,
      message: `Your ${config.BRAND_NAME} verification code is ${code}`
    });
  }

  return ok(res, { expiresIn: 600, devCode: config.NODE_ENV === "development" ? code : undefined }, "OTP sent");
}

authRouter.post("/otp/request", otpIpLimiter, otpUserLimiter, validate(otpRequestSchema), otpRequestHandler);
authRouter.post("/otp", otpIpLimiter, otpUserLimiter, validate(otpRequestSchema), otpRequestHandler);

async function otpVerifyHandler(req: Request, res: Response) {
  const { email, phone, code, purpose } = req.body;
  const otp = await prisma.otpCode.findFirst({
    where: {
      purpose: purpose as OtpPurpose,
      email: email || undefined,
      phone: phone || undefined,
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  const isBypass = code === config.OTP_BYPASS_CODE;
  if (!otp || (!isBypass && otp.code !== code) || otp.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() }
  });

  return ok(res, { verified: true }, "OTP verified");
}

authRouter.post("/otp/verify", otpIpLimiter, otpUserLimiter, validate(otpVerifySchema), otpVerifyHandler);
authRouter.post("/verify-otp", otpIpLimiter, otpUserLimiter, validate(otpVerifySchema), otpVerifyHandler);

authRouter.post("/verify-email", validate(verifyEmailSchema), asyncHandler(async (req, res) => {
  const { email, code } = req.body as { email: string; code: string };
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ success: false, message: "Account not found" });
  }

  if (user.verified) {
    return ok(res, { verified: true }, "Email already verified");
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      purpose: OtpPurpose.EMAIL_VERIFY,
      email,
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  const isBypass = code === config.OTP_BYPASS_CODE;
  if (!otp || (!isBypass && otp.code !== code) || otp.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "Invalid verification code" });
  }

  const adminEmails = config.ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase());
  const managerEmails = config.MANAGER_EMAILS.split(",").map(e => e.trim().toLowerCase());
  const isToBeAdmin = adminEmails.includes(email.trim().toLowerCase());
  const isToBeManager = managerEmails.includes(email.trim().toLowerCase());

  await prisma.$transaction([
    prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        emailVerifiedAt: new Date(),
        role: isToBeAdmin ? Role.ADMIN : isToBeManager ? Role.MANAGER : Role.USER
      }
    })
  ]);

  return ok(res, { verified: true }, "Email verified");
}));

authRouter.post("/forgot-password", validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        purpose: OtpPurpose.PASSWORD_RESET,
        code: generateOtp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
  }

  // Always return the same message - prevents email enumeration
  return ok(res, null, "If the account exists, a reset OTP has been issued");
}));

// ── Passwordless OTP Login Flow ─────────────────────────────────────────────

authRouter.post("/login-otp", otpIpLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "Valid email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const code = generateOtp();

  // Invalidate any previous LOGIN OTPs for this email
  await prisma.otpCode.updateMany({
    where: {
      purpose: OtpPurpose.LOGIN,
      email: normalizedEmail,
      consumedAt: null
    },
    data: { consumedAt: new Date() }
  });

  await prisma.otpCode.create({
    data: {
      email: normalizedEmail,
      purpose: OtpPurpose.LOGIN,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const delivered = await sendEmail({
    to: normalizedEmail,
    subject: `Your ${config.BRAND_NAME} login code`,
    html: `
      <p>Your login verification code is:</p>
      <p><strong style="font-size:24px;letter-spacing:4px">${code}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `
  });

  return ok(res, {
    isNewUser: !existingUser,
    emailSent: delivered,
    devCode: config.NODE_ENV === "development" ? code : undefined
  }, "Verification code sent to your email");
}));

authRouter.post("/verify-login", otpIpLimiter, asyncHandler(async (req, res) => {
  const { email, code, name } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Email and code are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = String(code).trim();

  const otp = await prisma.otpCode.findFirst({
    where: {
      purpose: OtpPurpose.LOGIN,
      email: normalizedEmail,
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  const isBypass = trimmedCode === config.OTP_BYPASS_CODE;
  if (!otp || (!isBypass && otp.code !== trimmedCode) || otp.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
  }

  // Consume the OTP
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() }
  });

  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    // New user — name is required
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name is required for new accounts (min 2 characters)" });
    }

    const adminEmails = config.ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase());
    const managerEmails = config.MANAGER_EMAILS.split(",").map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(normalizedEmail);
    const isManager = managerEmails.includes(normalizedEmail);

    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(generateOtp() + Date.now(), 10), // random placeholder password
        verified: true,
        emailVerifiedAt: new Date(),
        role: isAdmin ? Role.ADMIN : isManager ? Role.MANAGER : Role.USER
      }
    });
  } else {
    // Existing user — ensure verified and check admin status
    if (user.accountSuspended) {
      return res.status(403).json({ success: false, message: "Account suspended" });
    }

    const adminEmails = config.ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase());
    const managerEmails = config.MANAGER_EMAILS.split(",").map(e => e.trim().toLowerCase());
    const shouldBeAdmin = adminEmails.includes(normalizedEmail);
    const shouldBeManager = managerEmails.includes(normalizedEmail);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name ? name.trim() : user.name,
        verified: true,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        role: shouldBeAdmin ? Role.ADMIN : shouldBeManager ? Role.MANAGER : user.role
      }
    });

    // Refresh user data
    user = await prisma.user.findUnique({ where: { id: user.id } }) ?? user;
  }

  // Log user login in DeviceLog for audit logs
  await prisma.deviceLog.create({
    data: {
      userId: user.id,
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      action: "LOGIN",
      flagged: false,
      metadata: JSON.stringify({ email: user.email })
    }
  }).catch(() => undefined);

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    domain: config.COOKIE_DOMAIN !== "localhost" ? config.COOKIE_DOMAIN : undefined
  });

  return ok(res, { user: sanitizeUser(user) }, "Logged in");
}));
