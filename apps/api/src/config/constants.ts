export const GIFT_CARD_DEDUCTION_RATE = Number(process.env.GIFT_CARD_DEDUCTION_RATE ?? "0.08");

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const FULL_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
export const PIN_CODE_REGEX = /^[0-9]{6}$/;

export const RATE_LIMIT_MESSAGE = "Too many requests. Please try again later.";
