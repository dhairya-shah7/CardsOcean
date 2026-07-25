import test from "node:test";
import assert from "node:assert/strict";
import { incrementBucket, resetBuckets } from "../src/lib/redis.js";

test("incrementBucket increments within the TTL window", () => {
  resetBuckets();
  const first = incrementBucket("pan:user-1", 1000);
  const second = incrementBucket("pan:user-1", 1000);
  assert.equal(first.count, 1);
  assert.equal(second.count, 2);
});

