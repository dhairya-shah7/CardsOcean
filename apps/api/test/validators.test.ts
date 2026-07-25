import test from "node:test";
import assert from "node:assert/strict";
import { isValidPan, isValidPanName, isValidPinCode } from "../src/utils/validators.js";

test("isValidPan accepts PAN-shaped values", () => {
  assert.equal(isValidPan("ABCDE1234F"), true);
  assert.equal(isValidPan("bad-pan"), false);
});

test("isValidPanName validates alpha names", () => {
  assert.equal(isValidPanName("Ravi Kumar"), true);
  assert.equal(isValidPanName("A1"), false);
});

test("isValidPinCode accepts six digit codes", () => {
  assert.equal(isValidPinCode("400001"), true);
  assert.equal(isValidPinCode("40001"), false);
});

