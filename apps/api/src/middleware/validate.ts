import { AnyZodObject } from "zod";
import { NextFunction, Request, Response } from "express";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (err) {
      // Never log the request body — it may contain passwords, PAN, card numbers, etc.
      next(err);
    }
  };
}
