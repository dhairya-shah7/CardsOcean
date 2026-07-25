import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { config } from "../config.js";
import { AuthUser } from "../types.js";

export function signToken(payload: AuthUser) {
  return jwt.sign(payload as object, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET) as AuthUser;
}

