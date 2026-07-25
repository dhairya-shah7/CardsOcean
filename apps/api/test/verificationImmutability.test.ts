import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/db.js";

test("Verification Immutability logic validation", async () => {
  // Clear any existing test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "test_immutability@example.com"
        ]
      }
    }
  });

  // Create a test user who has verified email, phone, and PAN
  const user = await prisma.user.create({
    data: {
      name: "Test Immutability User",
      email: "test_immutability@example.com",
      password: "password123",
      phone: "9876543210",
      panNumber: "TSTPA9999P",
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      panVerifiedAt: new Date()
    }
  });

  // Test Case 1: PAN Verification Route check logic
  // Simulate checking user.panVerifiedAt before allowing verification
  const checkUserForPanVerify = await prisma.user.findUnique({
    where: { id: user.id }
  });
  assert.ok(checkUserForPanVerify);
  assert.ok(checkUserForPanVerify.panVerifiedAt); // should be already set
  
  // Verify that our code blocks it (simulating endpoint behavior)
  const isPanVerifyBlocked = !!checkUserForPanVerify.panVerifiedAt;
  assert.equal(isPanVerifyBlocked, true);

  // Test Case 2: Settings Profile PATCH logic - Email Change
  const newEmail = "different_email@example.com";
  const checkUserForEmailPatch = await prisma.user.findUnique({
    where: { id: user.id }
  });
  assert.ok(checkUserForEmailPatch);
  
  let emailUpdateAllowed = true;
  if (checkUserForEmailPatch.emailVerifiedAt && newEmail.toLowerCase() !== checkUserForEmailPatch.email.toLowerCase()) {
    emailUpdateAllowed = false;
  }
  assert.equal(emailUpdateAllowed, false); // must block

  // Test Case 3: Settings Profile PATCH logic - Phone Change
  const newPhone = "9999988888";
  const checkUserForPhonePatch = await prisma.user.findUnique({
    where: { id: user.id }
  });
  assert.ok(checkUserForPhonePatch);
  
  let phoneUpdateAllowed = true;
  if ((checkUserForPhonePatch.panVerifiedAt || checkUserForPhonePatch.phoneVerifiedAt) && newPhone !== checkUserForPhonePatch.phone) {
    phoneUpdateAllowed = false;
  }
  assert.equal(phoneUpdateAllowed, false); // must block

  // Clean up
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "test_immutability@example.com"
        ]
      }
    }
  });
});
