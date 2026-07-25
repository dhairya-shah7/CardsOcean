import { Router } from "express";
import { CardType } from "@prisma/client";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { listProducts } from "../services/catalog.js";
import { productListSchema, productSlugSchema } from "../schemas/catalog.js";
import { ok } from "../utils/responses.js";

const productSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  description: true,
  type: true,
  minAmount: true,
  maxAmount: true,
  image: true,
  gallery: true,
  verified: true,
  featured: true,
  trendingScore: true,
  status: true
} as const;

export const productsRouter = Router();

productsRouter.get("/", validate(productListSchema), async (req, res) => {
  try {
    const products = await listProducts({
      search: req.query.search as string | undefined,
      type: req.query.type as CardType | undefined,
      sort: req.query.sort as "popular" | "price_asc" | "price_desc" | undefined
    });

    return ok(res, products);
  } catch (error) {
    console.error(error);
    return ok(res, []);
  }
});

productsRouter.get("/featured/list", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true, status: "APPROVED" },
      orderBy: { trendingScore: "desc" },
      take: 6,
      select: productSelect
    });
    return ok(res, products);
  } catch (error) {
    console.error(error);
    return ok(res, []);
  }
});

productsRouter.get("/:slug", validate(productSlugSchema), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: String(req.params.slug) },
      select: {
        ...productSelect,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return ok(res, product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to load product" });
  }
});

