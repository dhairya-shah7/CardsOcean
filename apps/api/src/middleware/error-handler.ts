import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    // Flatten field errors into a single human-readable message
    const issues = error.errors;
    // Pick the first meaningful message — strip path prefix like "body." for cleaner UX
    const firstMessage = issues[0]?.message ?? "Validation failed";
    const fields = issues.map((i) => i.path.filter((p) => p !== "body").join(".")).filter(Boolean);

    return res.status(400).json({
      success: false,
      message: firstMessage,
      fields: fields.length ? fields : undefined
    });
  }

  // Prisma unique constraint violation
  if ((error as any)?.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this information already exists."
    });
  }

  // Prisma record not found
  if ((error as any)?.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "The requested record was not found."
    });
  }

  // Never leak internal error details in production
  const isDev = process.env.NODE_ENV !== "production";
  console.error("[API Error]", error?.message, isDev ? error?.stack : "");

  return res.status(500).json({
    success: false,
    message: isDev ? error.message : "Something went wrong. Please try again."
  });
}
