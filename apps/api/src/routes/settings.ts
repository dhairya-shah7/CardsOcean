import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ok } from "../utils/responses.js";
import { deliveryPreferencesSchema } from "../schemas/verification.js";
import { asyncHandler } from "../utils/async-handler.js";
import { z } from "zod";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

// Strict schema — only allow the two fields we intend to accept
const profileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).trim().optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number").nullable().optional(),
    email: z.string().email("Invalid email address").optional(),
    dob: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    deliveryAddressLine1: z.string().nullable().optional(),
    deliveryAddressLine2: z.string().nullable().optional(),
    deliveryCity: z.string().nullable().optional(),
    deliveryState: z.string().nullable().optional(),
    deliveryPostalCode: z.string().nullable().optional(),
    deliveryCountry: z.string().nullable().optional()
  }).strict()
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character")
  })
});

settingsRouter.get("/", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { addresses: true }
  });
  return ok(res, user);
}));

settingsRouter.patch("/profile", validate(profileUpdateSchema), asyncHandler(async (req, res) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Only update fields that were actually sent — prevents overwriting with undefined
  const data: Record<string, unknown> = {};
  if (req.body.name !== undefined) data.name = req.body.name;

  if (req.body.phone !== undefined) {
    const newPhone = req.body.phone ? req.body.phone.trim() : null;
    const oldPhone = currentUser.phone ? currentUser.phone.trim() : null;
    
    if (currentUser.role !== "ADMIN" && (currentUser.panVerifiedAt || currentUser.phoneVerifiedAt) && newPhone !== oldPhone) {
      return res.status(400).json({ success: false, message: "Verified phone number cannot be changed." });
    }

    if (newPhone !== null && newPhone !== "") {
      const existing = await prisma.user.findFirst({
        where: {
          phone: newPhone,
          id: { not: req.user!.id }
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Phone number is already in use by another account" });
      }
      data.phone = newPhone;
    } else {
      data.phone = null;
    }
  }

  if (req.body.email !== undefined) {
    const newEmail = req.body.email.trim().toLowerCase();
    
    if (currentUser.role !== "ADMIN" && currentUser.emailVerifiedAt && newEmail !== currentUser.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: "Verified email address cannot be changed." });
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: newEmail,
        id: { not: req.user!.id }
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email address is already in use by another account" });
    }
    data.email = newEmail;
  }

  if (req.body.dob !== undefined) data.dob = req.body.dob;
  if (req.body.gender !== undefined) data.gender = req.body.gender;
  if (req.body.deliveryAddressLine1 !== undefined) data.deliveryAddressLine1 = req.body.deliveryAddressLine1;
  if (req.body.deliveryAddressLine2 !== undefined) data.deliveryAddressLine2 = req.body.deliveryAddressLine2;
  if (req.body.deliveryCity !== undefined) data.deliveryCity = req.body.deliveryCity;
  if (req.body.deliveryState !== undefined) data.deliveryState = req.body.deliveryState;
  if (req.body.deliveryPostalCode !== undefined) data.deliveryPostalCode = req.body.deliveryPostalCode;
  if (req.body.deliveryCountry !== undefined) data.deliveryCountry = req.body.deliveryCountry || "India";

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data
  });
  return ok(res, user, "Profile updated");
}));

settingsRouter.patch("/delivery-preferences", validate(deliveryPreferencesSchema), asyncHandler(async (req, res) => {
  const { deliveryPreference, addressLine1, addressLine2, city, state, postalCode, country } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      deliveryPreference,
      deliveryAddressLine1: addressLine1 ?? null,
      deliveryAddressLine2: addressLine2 ?? null,
      deliveryCity: city ?? null,
      deliveryState: state ?? null,
      deliveryPostalCode: postalCode ?? null,
      deliveryCountry: country ?? "India"
    }
  });
  return ok(res, user, "Delivery preferences updated");
}));

settingsRouter.post("/change-password", validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const valid = await bcrypt.compare(req.body.currentPassword, user.password);
  if (!valid) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" });
  }

  // Prevent password reuse
  const samePassword = await bcrypt.compare(req.body.newPassword, user.password);
  if (samePassword) {
    return res.status(400).json({ success: false, message: "New password must be different from the current one" });
  }

  const password = await bcrypt.hash(req.body.newPassword, 12); // bumped cost from 10 to 12
  await prisma.user.update({
    where: { id: user.id },
    data: { password }
  });

  return ok(res, null, "Password updated");
}));
