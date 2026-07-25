import { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";

export async function logSensitiveAction(req: Request, _res: Response, next: NextFunction) {
  if (!["POST", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  const sensitivePrefixes = ["/api/auth", "/api/cards", "/api/checkout", "/api/admin"];
  if (!sensitivePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    return next();
  }

  await prisma.deviceLog.create({
    data: {
      userId: req.user?.id,
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      action: `${req.method} ${req.path}`,
      flagged: false
    }
  }).catch(() => undefined);

  next();
}

