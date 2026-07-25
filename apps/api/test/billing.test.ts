import test from "node:test";
import assert from "node:assert/strict";
import { calculateBillSummary } from "../src/utils/billing.js";

test("calculateBillSummary applies the configured deduction rate", () => {
  const summary = calculateBillSummary(2500, "VIRTUAL");
  assert.equal(summary.faceValue, 2500);
  assert.equal(summary.deductionAmount, 200);
  assert.equal(summary.finalCreditedAmount, 2300);
});

test("calculateBillSummary calculates 3% convenience charge with correct breakdown and ₹50 delivery fee", () => {
  // Virtual Order: 3% convenience fee + 18% GST on top
  const virtualSummary = calculateBillSummary(2500, "VIRTUAL");
  assert.equal(virtualSummary.taxAmount, 89); // 3% of 2500 = 75; 18% of 75 = 14; 75 + 14 = 89
  assert.equal(virtualSummary.deliveryCharge, 0);
  assert.equal(virtualSummary.total, 2589); // 2500 + 89

  // Check breakdown
  // convenienceCharge = 75
  // gstAmount = Math.round(75 * 0.18) = 14
  // paymentCharges = Math.round(2500 * 0.01) = 25
  // platformFee = Math.round(2500 * 0.02) = 50
  assert.equal(virtualSummary.gstAmount, 14);
  assert.equal(virtualSummary.paymentCharges, 25);
  assert.equal(virtualSummary.platformFee, 50);

  // Physical Order: 3% fee (₹75) + 18% GST (₹14) + ₹50 delivery charge
  const physicalSummary = calculateBillSummary(2500, "PHYSICAL");
  assert.equal(physicalSummary.taxAmount, 89);
  assert.equal(physicalSummary.deliveryCharge, 50);
  assert.equal(physicalSummary.total, 2639); // 2500 + 89 + 50
});

