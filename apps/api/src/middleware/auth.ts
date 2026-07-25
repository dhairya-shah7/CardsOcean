import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import fs from "fs";
import path from "path";
import { prisma } from "../db.js";
import { config } from "../config.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

const SESSIONS_DIR = path.resolve(".generated/db");
const SESSIONS_FILE = path.join(SESSIONS_DIR, "ip_sessions.json");

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}

function readIpSessions(): Record<string, { id: string, email: string, role: string }> {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    if (fs.existsSync(SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

function writeIpSessions(sessions: Record<string, { id: string, email: string, role: string }>) {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (e) {
    // ignore
  }
}

async function attachDevSession(res: Response, req: Request) {
  const demoUser = await prisma.user.upsert({
    where: { email: "user@elitepay.dev" },
    update: {},
    create: {
      name: "Demo Buyer",
      email: "user@elitepay.dev",
      password: await bcrypt.hash("Password@123", 10),
      verified: true
    }
  });

  const token = signToken({ id: demoUser.id, email: demoUser.email, role: demoUser.role });
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    domain: config.COOKIE_DOMAIN !== "localhost" ? config.COOKIE_DOMAIN : undefined
  });

  req.user = { id: demoUser.id, email: demoUser.email, role: demoUser.role };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  let token = req.cookies.session || req.headers.authorization?.replace("Bearer ", "");

  // Check IP session if token is absent
  if (!token) {
    const sessions = readIpSessions();
    const saved = sessions[ip];
    if (saved) {
      try {
        const user = await prisma.user.findUnique({ where: { id: saved.id } });
        if (user) {
          const newToken = signToken({ id: user.id, email: user.email, role: user.role });
          res.cookie("session", newToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: config.NODE_ENV === "production",
            domain: config.COOKIE_DOMAIN !== "localhost" ? config.COOKIE_DOMAIN : undefined
          });
          token = newToken;
        }
      } catch (err) {
        logger.error("Failed auto-login via IP session", err);
      }
    }
  }

  if (!token) {
    if (config.NODE_ENV === "development") {
      try {
        await attachDevSession(res, req);
        if (req.user) {
          const sessions = readIpSessions();
          sessions[ip] = { id: req.user.id, email: req.user.email, role: req.user.role };
          writeIpSessions(sessions);
        }
        next();
      } catch (error) {
        logger.error("Failed to attach dev session", error);
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      return;
    }

    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      throw new Error("User does not exist in the database");
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    
    // Save current session to IP
    const sessions = readIpSessions();
    sessions[ip] = { id: user.id, email: user.email, role: user.role };
    writeIpSessions(sessions);
    
    next();
  } catch (error) {
    if (config.NODE_ENV === "development") {
      try {
        await attachDevSession(res, req);
        if (req.user) {
          const sessions = readIpSessions();
          sessions[ip] = { id: req.user.id, email: req.user.email, role: req.user.role };
          writeIpSessions(sessions);
        }
        next();
      } catch (err) {
        logger.error("Failed to attach dev session", err);
        return res.status(401).json({ success: false, message: "Invalid session" });
      }
      return;
    }

    res.clearCookie("session", {
      domain: config.COOKIE_DOMAIN !== "localhost" ? config.COOKIE_DOMAIN : undefined
    });
    return res.status(401).json({ success: false, message: "Invalid session" });
  }
}

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
}

