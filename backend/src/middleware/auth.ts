import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import type { UserRole } from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET ?? "change_me_in_production";

export interface AuthUser {
  id: mongoose.Types.ObjectId;
  role: UserRole;
  email?: string;
  name?: string;
}




declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export function requireAuth(roles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: UserRole;
        email?: string;
        name?: string;
      };

      if (!payload?.id || !payload?.role) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (roles) {
        const normalizedRoles = roles.map(r => r.toLowerCase().trim());
        const userRole = payload.role.toLowerCase().trim();
        if (!normalizedRoles.includes(userRole)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      req.authUser = {
        id: new mongoose.Types.ObjectId(payload.id),
        role: payload.role,
      };

      if (payload.email) req.authUser.email = payload.email;
      if (payload.name) req.authUser.name = payload.name;

      return next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
}

