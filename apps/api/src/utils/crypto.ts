import crypto from "crypto";
import { config } from "../config.js";

const key = crypto.createHash("sha256").update(config.ENCRYPTION_SECRET).digest();

export function encrypt(plainText: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(payload: string) {
  const [ivHex, encryptedHex] = payload.split(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskCardNumber(cardNumber: string) {
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
}

