import { z } from "zod";

const amount = z.number().int().min(1000).max(10000);

export const createCartItemSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
    amount,
    cardType: z.enum(["VIRTUAL", "PHYSICAL"])
  })
});

export const updateCartItemSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    quantity: z.number().int().min(1).max(10).optional(),
    amount: amount.optional(),
    savedForLater: z.boolean().optional()
  })
});

