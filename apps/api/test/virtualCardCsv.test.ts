import test from "node:test";
import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import { appendVirtualCardCsv } from "../src/db.js";
import { virtualDetailsCsvPath } from "./csv-paths.js";

test("appendVirtualCardCsv writes correct headers and details to the virtual card details CSV", async () => {
  // Clean up any existing file from previous runs/tests if needed
  try {
    await unlink(virtualDetailsCsvPath);
  } catch {}

  const testDetails = {
    cardHolderName: "Jane Doe",
    mobileNumber: "9876543210",
    cardNumber: "1111 2222 3333 4444",
    expiryDate: "05/29",
    cvv: "123",
    otp: "5555",
    pin: "9999",
    cardReferenceId: "ref-123456",
    amount: 1500,
    currentBalance: "1500"
  };

  await appendVirtualCardCsv(testDetails);

  const fileContent = await readFile(virtualDetailsCsvPath, "utf8");
  const lines = fileContent.trim().split("\n");

  assert.equal(lines.length, 1);

  // Check headers
  const headers = lines[0].split(",");
  assert.deepEqual(headers, [
    "Name on Card",
    "Mobile Number",
    "Card Number",
    "Expiry Date",
    "CVV",
    "OTP",
    "Pin",
    "Card Reference Id",
    "Amount",
    "Current Balance"
  ]);

  // Clean up
  try {
    await unlink(virtualDetailsCsvPath);
  } catch {}
});
