import { addYears } from "../utils/date.js";

export function generateCardNumber() {
  const bin = "608014";
  const tail = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  return `${bin}${tail}`;
}

export function generateCvv() {
  return `${Math.floor(100 + Math.random() * 900)}`;
}

export function defaultExpiry() {
  return addYears(new Date(), 3);
}

