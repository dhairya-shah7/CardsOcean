import { Router } from "express";
import { prisma, appendVerifyCsv } from "../db.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { deliveryPreferencesSchema } from "../schemas/verification.js";
import { panVerificationSchema } from "../schemas/auth.js";
import { ok } from "../utils/responses.js";
import { emailIpLimiter, emailUserLimiter, verifyPanLimiter } from "../middleware/rate-limits.js";
import { logger } from "../utils/logger.js";
import { asyncHandler } from "../utils/async-handler.js";

export const verificationRouter = Router();

verificationRouter.use(requireAuth);

verificationRouter.post(
  "/verify-pan",
  verifyPanLimiter,
  validate(panVerificationSchema),
  asyncHandler(async (req, res) => {
    const { mobileNumber, panNumber, email } = req.body;

    let user;
    try {
      user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    } catch (error) {
      logger.error("Database error fetching user for PAN verification", { error: error instanceof Error ? error.message : String(error) });
      return res.status(500).json({ success: false, message: "Database error occurred. Please try again." });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.panVerifiedAt) {
      return res.status(400).json({ success: false, message: "PAN and mobile details are already verified and stored on the server. They cannot be re-verified." });
    }

    const now = new Date();
    const lockedUntil = user.panVerificationLockedUntil;
    if (config.NODE_ENV === "production" && lockedUntil && lockedUntil > now) {
      return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    }

    const dbPhone = user.phone ? user.phone.trim() : "";
    const inputPhone = mobileNumber.trim();
    const dbEmail = user.email.trim().toLowerCase();
    const inputEmail = email.trim().toLowerCase();

    // Identify if the user is an admin
    const adminEmails = ["rugs1007@gmail.com", "dhairyaqwerty1@gmail.com"];
    const isAdmin = user.role === "ADMIN" || adminEmails.includes(dbEmail);

    const inputPan = (panNumber || "").trim().toUpperCase() || (isAdmin ? "ADMINPAN12" : "");

    // ⚠️ Never log PAN, email or phone — those are highly sensitive PII
    const isDev = config.NODE_ENV !== "production";
    
    let success = false;
    if (isAdmin) {
      success = true;
    } else {
      // Validate PAN format for regular users
      const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(inputPan);
      if (!isPanValid) {
        return res.status(400).json({ success: false, message: "Invalid PAN format. Must be in format ABCDE1234F." });
      }
      success = isDev
        ? inputPan.length === 10
        : dbEmail === inputEmail && (dbPhone === "" || dbPhone === inputPhone) && inputPan.length === 10;
    }

    if (success && !isAdmin) {
      // Check if this PAN is already verified by another user with a different phone number
      const panLinked = await prisma.user.findFirst({
        where: {
          panNumber: inputPan,
          id: { not: user.id }
        }
      });
      if (panLinked && panLinked.phone?.trim() !== inputPhone) {
        return res.status(400).json({
          success: false,
          message: "PAN-Mobile mismatch: This PAN is linked to a different mobile number."
        });
      }

      // Check if this phone number is already verified by another user with a different PAN
      const phoneLinked = await prisma.user.findFirst({
        where: {
          phone: inputPhone,
          panNumber: { not: null },
          id: { not: user.id }
        }
      });
      if (phoneLinked && phoneLinked.panNumber?.trim().toUpperCase() !== inputPan) {
        return res.status(400).json({
          success: false,
          message: "PAN-Mobile mismatch: This mobile number is linked to a different PAN."
        });
      }

      // Check if the phone number is already registered by another user
      const phoneInUse = await prisma.user.findFirst({
        where: {
          phone: inputPhone,
          id: { not: user.id }
        }
      });
      if (phoneInUse) {
        return res.status(400).json({
          success: false,
          message: "This mobile number is already registered with another account."
        });
      }

      // Check if the email is already registered by another user (only in dev where email can be updated)
      if (isDev) {
        const emailInUse = await prisma.user.findFirst({
          where: {
            email: inputEmail,
            id: { not: user.id }
          }
        });
        if (emailInUse) {
          return res.status(400).json({
            success: false,
            message: "This email address is already registered with another account."
          });
        }
      }
    }

    const attempts = (user.panVerificationAttempts ?? 0) + (success ? 0 : 1);
    const lock = !success && attempts >= 3 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone: success ? mobileNumber.trim() : user.phone,
          email: isDev && success ? email.trim() : user.email,
          panNumber: success ? inputPan : user.panNumber,
          panVerifiedAt: success ? new Date() : user.panVerifiedAt,
          panVerificationAttempts: success ? 0 : attempts,
          panVerificationWindowStartedAt: success ? null : (user.panVerificationWindowStartedAt ?? now),
          panVerificationLockedUntil: lock
        }
      });
    } catch (error: any) {
      logger.error("Database error updating user after PAN verification", { error: error instanceof Error ? error.message : String(error) });
      if (error?.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "This information is already associated with another account."
        });
      }
      return res.status(500).json({ success: false, message: "Database error occurred. Please try again." });
    }

    try {
      await appendVerifyCsv({
        userId: user.id,
        email,
        mobileNumber,
        panNumber,
        status: success ? "SUCCESS" : "FAILED",
        date: new Date().toISOString()
      });

    } catch (err) {
      logger.error("Failed to write verification details to CSV");
    }

    if (!success && lock) {
      await prisma.adminActivityLog.create({
        data: {
          actorId: user.id,
          action: "PAN_VERIFICATION_LOCKED",
          targetType: "User",
          targetId: user.id
        }
      }).catch((error: any) => logger.error("PAN lock logging failed", { message: error?.message }));
    }

    if (success) {
      // Flag account if the same PAN is already used by 2+ other users — possible identity theft
      try {
        const samePanUsers = await prisma.user.findMany({
          where: {
            panNumber,
            id: { not: user.id }
          }
        });

        if (samePanUsers.length >= 2) {
          await prisma.user.updateMany({
            where: { panNumber },
            data: { accountFlagged: true }
          });
          logger.warn("Duplicate PAN detected — accounts flagged", { panCount: samePanUsers.length + 1 });
        }
      } catch (error) {
        logger.error("Database error checking for duplicate PAN", { error: error instanceof Error ? error.message : String(error) });
        // Don't fail the verification if duplicate check fails - log and continue
      }
    }

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "PAN verification failed. Please check your details and try again.",
        data: { verified: false, lockedUntil: lock }
      });
    }

    return ok(res, { verified: true, lockedUntil: null }, "PAN verified");
  })
);

verificationRouter.post(
  "/delivery-preferences",
  emailIpLimiter,
  emailUserLimiter,
  validate(deliveryPreferencesSchema),
  asyncHandler(async (req, res) => {
    const { deliveryPreference, addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    if (deliveryPreference === "PHYSICAL" && (!addressLine1 || !city || !state || !postalCode)) {
      return res.status(400).json({ success: false, message: "Address is required for physical delivery" });
    }

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

    return ok(res, user, "Delivery preferences saved");
  })
);
