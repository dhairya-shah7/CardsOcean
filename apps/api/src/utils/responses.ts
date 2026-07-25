import { Response } from "express";

export function ok(res: Response, data: unknown, message?: string) {
  return res.json({ success: true, message, data });
}

export function created(res: Response, data: unknown, message?: string) {
  return res.status(201).json({ success: true, message, data });
}

