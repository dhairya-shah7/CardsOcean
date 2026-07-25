import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/db.js";

test("PAN-Mobile mapping constraints", async () => {
  // Clear any existing test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "test_user1@example.com",
          "test_user2@example.com"
        ]
      }
    }
  });

  // Create primary test user who will verify first
  const user1 = await prisma.user.create({
    data: {
      name: "Test User One",
      email: "test_user1@example.com",
      password: "password123",
      phone: "9876543210",
      panNumber: "TSTPA1234B",
      panVerifiedAt: new Date()
    }
  });

  // Create a second test user who will try to verify
  const user2 = await prisma.user.create({
    data: {
      name: "Test User Two",
      email: "test_user2@example.com",
      password: "password123"
    }
  });

  // Simulate verification checks
  // Test case 1: Another user trying to verify the SAME PAN with a different phone number
  const inputPhone = "9999999999";
  const panNumber = "TSTPA1234B";

  const panLinked = await prisma.user.findFirst({
    where: {
      panNumber: panNumber.trim().toUpperCase(),
      id: { not: user2.id }
    }
  });

  assert.ok(panLinked);
  assert.equal(panLinked.phone?.trim(), "9876543210");
  assert.notEqual(panLinked.phone?.trim(), inputPhone); // mismatch!

  // Test case 2: Another user trying to verify a different PAN with the same phone number (phone already in use)
  const otherPan = "XYZAB5678C";
  const samePhone = "9876543210";

  const phoneInUse = await prisma.user.findFirst({
    where: {
      phone: samePhone,
      id: { not: user2.id }
    }
  });

  assert.ok(phoneInUse);
  assert.equal(phoneInUse.email, "test_user1@example.com"); // phone belongs to user1!

  // Test case 3: Phone number registered by another user with different PAN
  const phoneLinked = await prisma.user.findFirst({
    where: {
      phone: samePhone,
      panNumber: { not: null },
      id: { not: user2.id }
    }
  });

  assert.ok(phoneLinked);
  assert.notEqual(phoneLinked.panNumber?.trim().toUpperCase(), otherPan.trim().toUpperCase()); // mismatch!

  // Clean up
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "test_user1@example.com",
          "test_user2@example.com"
        ]
      }
    }
  });
});
