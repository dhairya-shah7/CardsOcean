import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { ok, created } from "../utils/responses.js";
import { asyncHandler } from "../utils/async-handler.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(2).max(200),
    message: z.string().min(5).max(2000)
  })
});

// Create a review (requires auth)
reviewsRouter.post("/", requireAuth, validate(createReviewSchema), asyncHandler(async (req, res) => {
  const { productId, rating, title, message } = req.body;

  // Check if the product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  // Check if user already reviewed this product
  const existing = await prisma.review.findFirst({
    where: { userId: req.user!.id, productId }
  });
  if (existing) {
    return res.status(400).json({ success: false, message: "You have already reviewed this product" });
  }

  const review = await prisma.review.create({
    data: {
      userId: req.user!.id,
      productId,
      rating,
      title,
      message
    },
    include: {
      user: { select: { name: true } }
    }
  });

  // Log audit
  await prisma.adminActivityLog.create({
    data: {
      actorId: req.user!.id,
      action: "CREATE_REVIEW",
      targetType: "Review",
      targetId: review.id
    }
  }).catch(() => {});

  await prisma.deviceLog.create({
    data: {
      userId: req.user!.id,
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      action: "SUBMIT_REVIEW",
      flagged: false,
      metadata: JSON.stringify({ productId: review.productId, reviewId: review.id, rating: review.rating })
    }
  }).catch(() => {});

  return created(res, review, "Review submitted");
}));

// Get reviews for a product (public)
reviewsRouter.get("/:productId", asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: String(req.params.productId) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true } }
    }
  });

  return ok(res, reviews);
}));
