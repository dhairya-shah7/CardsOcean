import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so that any rejected promise is forwarded
 * to Express's next(err) → errorHandler middleware.
 *
 * Usage:
 *   router.get("/path", asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
