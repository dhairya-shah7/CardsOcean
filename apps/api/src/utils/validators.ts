import { FULL_NAME_REGEX, PAN_REGEX, PIN_CODE_REGEX } from "../config/constants.js";

export function isValidPan(value: string) {
  return PAN_REGEX.test(value);
}

export function isValidPanName(value: string) {
  const normalized = value.trim();
  return normalized.length >= 3 && FULL_NAME_REGEX.test(normalized);
}

export function isValidPinCode(value: string) {
  return PIN_CODE_REGEX.test(value);
}

