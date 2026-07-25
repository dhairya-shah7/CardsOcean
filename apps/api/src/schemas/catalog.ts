import { z } from "zod";

export const productListSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    type: z.enum(["VIRTUAL", "PHYSICAL"]).optional(),
    sort: z.enum(["popular", "price_asc", "price_desc"]).optional()
  })
});

export const productSlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1)
  })
});

