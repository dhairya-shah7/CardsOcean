import { z } from "zod";

export const revealSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

