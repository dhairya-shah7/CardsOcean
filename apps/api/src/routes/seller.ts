import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { created, ok } from "../utils/responses.js";

export const sellerRouter = Router();

sellerRouter.use(requireAuth, requireRole([Role.ADMIN]));

sellerRouter.get("/overview", async (req, res) => {
  const products = await prisma.product.findMany({
    where: { sellerId: req.user!.id },
    orderBy: { createdAt: "desc" }
  });
  return ok(res, {
    products,
    analytics: {
      activeListings: products.filter((item: any) => item.status === "APPROVED").length,
      totalListings: products.length
    }
  });
});

sellerRouter.post("/products", async (req, res) => {
  const product = await prisma.product.create({
    data: {
      sellerId: req.user!.id,
      slug: req.body.slug,
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      type: req.body.type,
      minAmount: 1000,
      maxAmount: 10000,
      image: req.body.image,
      gallery: req.body.gallery || [],
      status: "DRAFT"
    }
  });
  return created(res, product, "Product submitted");
});
