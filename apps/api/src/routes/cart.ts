import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCartItemSchema, updateCartItemSchema } from "../schemas/cart.js";
import { created, ok } from "../utils/responses.js";
import { asyncHandler } from "../utils/async-handler.js";

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get("/", asyncHandler(async (req, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.id },
    include: { product: true }
  });
  return ok(res, items);
}));

cartRouter.post("/items", validate(createCartItemSchema), asyncHandler(async (req, res) => {
  const item = await prisma.cartItem.create({
    data: {
      userId: req.user!.id, // Always set from authenticated session — never from body
      savedForLater: false,
      ...req.body
    },
    include: { product: true }
  });

  // Log cart addition in DeviceLog for audit logs
  await prisma.deviceLog.create({
    data: {
      userId: req.user!.id,
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      action: "ADD_TO_CART",
      flagged: false,
      metadata: JSON.stringify({ productId: item.productId, quantity: item.quantity, title: item.product?.title })
    }
  }).catch(() => undefined);

  return created(res, item, "Added to cart");
}));

cartRouter.patch("/items/:id", validate(updateCartItemSchema), asyncHandler(async (req, res) => {
  // Verify ownership before update — prevents IDOR
  const existing = await prisma.cartItem.findFirst({
    where: { id: String(req.params.id), userId: req.user!.id }
  });
  if (!existing) {
    return res.status(404).json({ success: false, message: "Cart item not found" });
  }

  const item = await prisma.cartItem.update({
    where: { id: existing.id },
    data: req.body,
    include: { product: true }
  });
  return ok(res, item, "Cart updated");
}));

cartRouter.delete("/items/:id", asyncHandler(async (req, res) => {
  // Verify ownership before delete — prevents IDOR
  const existing = await prisma.cartItem.findFirst({
    where: { id: String(req.params.id), userId: req.user!.id }
  });
  if (!existing) {
    return res.status(404).json({ success: false, message: "Cart item not found" });
  }

  await prisma.cartItem.delete({ where: { id: existing.id } });
  return ok(res, null, "Item removed");
}));
