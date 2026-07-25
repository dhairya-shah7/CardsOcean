import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { created, ok } from "../utils/responses.js";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get("/", async (req, res) => {
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    include: { product: true }
  });
  return ok(res, wishlist);
});

wishlistRouter.post("/:productId", async (req, res) => {
  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: req.user!.id,
        productId: req.params.productId
      }
    },
    update: {},
    create: {
      userId: req.user!.id,
      productId: req.params.productId
    },
    include: { product: true }
  });
  return created(res, item, "Added to wishlist");
});

wishlistRouter.delete("/:productId", async (req, res) => {
  await prisma.wishlistItem.delete({
    where: {
      userId_productId: {
        userId: req.user!.id,
        productId: req.params.productId
      }
    }
  });
  return ok(res, null, "Removed from wishlist");
});

