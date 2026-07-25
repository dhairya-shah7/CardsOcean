import test from "node:test";
import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import { appendVirtualCardOrderCsv } from "../src/db.js";
import { virtualOrdersCsvPath } from "./csv-paths.js";

test("appendVirtualCardOrderCsv writes the selected amount to the virtual order CSV", async () => {
  try {
    await unlink(virtualOrdersCsvPath);
  } catch {}

  await appendVirtualCardOrderCsv({
    orderId: "order-123",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "9876543210",
    cardReferenceId: "order-123",
    amount: 10000,
    numberOfCards: 1
  });

  const fileContent = await readFile(virtualOrdersCsvPath, "utf8");
  const lines = fileContent.trim().split("\n");

  assert.equal(lines.length, 2);

  const headers = lines[0].split(",");
  assert.deepEqual(headers, [
    "Order ID",
    "Customer Name",
    "Email",
    "Mobile Number",
    "Card Reference Id",
    "Amount",
    "Number of Cards",
    "Order Date"
  ]);

  const data = lines[1].split(",");
  assert.equal(data[0], "order-123");
  assert.equal(data[1], "Jane Doe");
  assert.equal(data[2], "jane@example.com");
  assert.equal(data[3], "9876543210");
  assert.equal(data[4], "order-123");
  assert.equal(data[5], "10000");
  assert.equal(data[6], "1");

  try {
    await unlink(virtualOrdersCsvPath);
  } catch {}
});
