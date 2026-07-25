import { z } from "zod";

export const updateProductStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(["DRAFT", "APPROVED", "REJECTED"])
  })
});

