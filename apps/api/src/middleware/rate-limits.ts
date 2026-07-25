import rateLimit from "express-rate-limit";
import { RATE_LIMIT_MESSAGE } from "../config/constants.js";
import { config } from "../config.js";

function createLimiter(windowMs: number, max: number, keyGenerator?: any) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: RATE_LIMIT_MESSAGE },
    keyGenerator,
    // In development, skip all rate limiting so testing is never blocked
    skip: (_req, _res) => config.NODE_ENV !== "production",
    handler: (_req, res) => res.status(429).json({ success: false, message: RATE_LIMIT_MESSAGE })
  });
}

export const globalLimiter = createLimiter(15 * 60 * 1000, config.NODE_ENV === "production" ? 100 : 1000);

export const loginLimiter = createLimiter(15 * 60 * 1000, 10);
export const signupLimiter = createLimiter(15 * 60 * 1000, 10);
export const otpIpLimiter = createLimiter(10 * 60 * 1000, 5);
export const otpUserLimiter = createLimiter(24 * 60 * 60 * 1000, 3, (req: any) => req.user?.id ?? req.ip);
export const verifyPanLimiter = createLimiter(24 * 60 * 60 * 1000, 3, (req: any) => req.user?.id ?? req.ip);
export const emailIpLimiter = createLimiter(60 * 60 * 1000, 5);
export const emailUserLimiter = createLimiter(60 * 60 * 1000, 3, (req: any) => req.user?.id ?? req.ip);
export const checkoutLimiter = createLimiter(60 * 60 * 1000, config.NODE_ENV === "production" ? 10 : 1000);
export const revealLimiter = createLimiter(60 * 60 * 1000, 5);
