import { CardType, Prisma } from "@prisma/client";
import { prisma } from "../db.js";

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
} satisfies Prisma.ProductSelect;

export async function listProducts(filters: {
  search?: string;
  type?: CardType;
  sort?: "popular" | "price_asc" | "price_desc";
}) {
  const where: Prisma.ProductWhereInput = {
    status: "APPROVED",
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(filters.type ? { type: filters.type } : {})
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { minAmount: "asc" }
      : filters.sort === "price_desc"
        ? { maxAmount: "desc" }
        : { trendingScore: "desc" };

  return prisma.product.findMany({
    where,
    orderBy,
    select: productSelect
  });
}

