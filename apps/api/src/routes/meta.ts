import { Router } from "express";
import { getBrandConfig } from "../services/brand.js";
import { ok } from "../utils/responses.js";

export const metaRouter = Router();

metaRouter.get("/brand", async (_req, res) => {
  return ok(res, getBrandConfig());
});

