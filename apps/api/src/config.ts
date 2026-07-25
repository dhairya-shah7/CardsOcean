import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const apiDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(apiDir, "../.env") });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional().default(""),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ENCRYPTION_SECRET: z.string().min(16),
  FRONTEND_URL: z.string().url(),
  COOKIE_DOMAIN: z.string().default("localhost"),
  OTP_BYPASS_CODE: z.string().default("123456"),
  BRAND_NAME: z.string().default("Cards Ocean"),
  BRAND_LOGO_URL: z.string().optional().default("/logo/ChatGPT%20Image%20Jun%2020,%202026,%2004_36_15%20PM.png"),
  BRAND_TAGLINE: z.string().default("Premium gifting powered by secure fintech rails"),
  CARD_REVEAL_LIMIT: z.coerce.number().default(3),
  GIFT_CARD_DEDUCTION_RATE: z.coerce.number().default(0.08),
  ADMIN_EMAILS: z.string().default("rugs1007@gmail.com,dhairyaqwerty1@gmail.com"),
  MANAGER_EMAILS: z.string().default("manager@elitepay.dev")
});

export const config = schema.parse(process.env);
