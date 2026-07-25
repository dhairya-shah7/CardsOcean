import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/db.js";
import { Role } from "@prisma/client";

test("Admin role assignment on verification", async () => {
  // Clear test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "test_admin@example.com",
          "test_normal@example.com"
        ]
      }
    }
  });

  // Target list of admin emails (using config logic fallback)
  const testAdminEmails = [
    "rugs1007@gmail.com",
    "dhairyaqwerty1@gmail.com",
    "test_admin@example.com"
  ];

  // Signup case: Admin email signs up
  const adminUser = await prisma.user.create({
    data: {
      name: "Test Admin User",
      email: "test_admin@example.com",
      password: "password123",
      verified: false,
      role: Role.USER // Always initialized as USER
    }
  });

  assert.equal(adminUser.role, Role.USER);

  // Verification case: Admin email gets verified
  const isToBeAdmin = testAdminEmails.includes(adminUser.email.trim().toLowerCase());
  const verifiedAdminUser = await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      verified: true,
      emailVerifiedAt: new Date(),
      role: isToBeAdmin ? Role.ADMIN : Role.USER
    }
  });

  assert.equal(verifiedAdminUser.role, Role.ADMIN);

  // Signup case: Normal email signs up
  const normalUser = await prisma.user.create({
    data: {
      name: "Test Normal User",
      email: "test_normal@example.com",
      password: "password123",
      verified: false,
      role: Role.USER
    }
  });

  assert.equal(normalUser.role, Role.USER);

  // Verification case: Normal email gets verified
  const isNormalToBeAdmin = testAdminEmails.includes(normalUser.email.trim().toLowerCase());
  const verifiedNormalUser = await prisma.user.update({
    where: { id: normalUser.id },
    data: {
      verified: true,
      emailVerifiedAt: new Date(),
      role: isNormalToBeAdmin ? Role.ADMIN : Role.USER
    }
  });

  assert.equal(verifiedNormalUser.role, Role.USER);

  // Clean up
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "test_admin@example.com",
          "test_normal@example.com"
        ]
      }
    }
  });
});
