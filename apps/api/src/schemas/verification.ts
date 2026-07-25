import { z } from "zod";

export const deliveryPreferencesSchema = z.object({
  body: z.object({
    deliveryPreference: z.enum(["VIRTUAL", "PHYSICAL"]),
    addressLine1: z.string().min(3).optional(),
    addressLine2: z.string().optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    postalCode: z.string().regex(/^[0-9]{6}$/).optional(),
    country: z.string().min(2).default("India")
  })
});

