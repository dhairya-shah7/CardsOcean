export type BillSummary = {
  faceValue: number;
  deductionRate: number;
  deductionAmount: number;
  finalCreditedAmount: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  paymentCharges: number;
  platformFee: number;
  gstAmount: number;
  deliveryCharge: number;
};

function resolveDeductionRate() {
  const rate = Number(process.env.GIFT_CARD_DEDUCTION_RATE ?? "0.08");
  return Number.isFinite(rate) ? rate : 0.08;
}

export function calculateBillSummary(
  faceValue: number,
  deliveryMethod: "VIRTUAL" | "PHYSICAL" = "VIRTUAL"
): BillSummary {
  const deductionRate = resolveDeductionRate();
  const deductionAmount = Math.round(faceValue * deductionRate);
  const finalCreditedAmount = Math.max(faceValue - deductionAmount, 0);

  // convenience charges: 3% of face value
  const paymentCharges = Math.round(faceValue * 0.01); // 1.0%
  const platformFee = Math.round(faceValue * 0.02); // 2.0%
  const convenienceCharge = paymentCharges + platformFee; // 3.0% total

  // GST is 18% of the 3% convenience charge
  const gstAmount = Math.round(convenienceCharge * 0.18);

  // Combined tax/fees column stored in order
  const taxAmount = convenienceCharge + gstAmount;

  // physical delivery charge 50 rs
  const deliveryCharge = deliveryMethod === "PHYSICAL" ? 50 : 0;

  const subtotal = faceValue;
  const total = faceValue + taxAmount + deliveryCharge;

  return {
    faceValue,
    deductionRate,
    deductionAmount,
    finalCreditedAmount,
    taxAmount,
    subtotal,
    total,
    paymentCharges,
    platformFee,
    gstAmount,
    deliveryCharge
  };
}

