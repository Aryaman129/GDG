import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import dotenv from "dotenv";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const DEMO_MODE = process.env.DEMO_MODE === "true"; // Only enable demo mode if explicitly set to true

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
      };
    }
  }
}

// Middleware to authenticate token (JWT from Supabase Auth)
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If demo mode is enabled, skip authentication and use a demo user
  if (DEMO_MODE) {
    console.log("DEMO MODE: Authentication bypassed");

    // Determine the appropriate role based on the URL path
    let demoUserId = "demo-user-id";
    let demoEmail = "demo@example.com";
    let demoRole: Role = Role.USER;

    // For speaker-related endpoints, use the demo speaker
    if (req.originalUrl.includes("/speakers/me") ||
        req.originalUrl.includes("/speakers/slots") ||
        req.originalUrl.includes("/bookings/speaker") ||
        req.originalUrl.includes("/speaker")) {
      demoUserId = "demo-speaker-id";
      demoEmail = "demo-speaker@example.com";
      demoRole = Role.SPEAKER;
    }
    // For admin endpoints, use admin role
    else if (req.originalUrl.includes("/admin")) {
      demoRole = Role.ADMIN;
    }

    console.log(`DEMO MODE: Using ${demoRole} role for ${req.originalUrl}`);

    req.user = {
      userId: demoUserId,
      email: demoEmail,
      role: demoRole,
    };

    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) {
    res.sendStatus(401); // if there isn\"t any token
    return;
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Token is valid, fetch user profile from our DB to get role
    const userProfile = await prisma.profile.findUnique({
      where: { id: decoded.userId },
    });

    if (!userProfile) {
      console.error(`Profile not found for user ID: ${decoded.userId}`);
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    // Attach user info to the request object
    req.user = {
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role as Role, // Cast role string to Role enum
    };

    next(); // pass the execution to the next handler
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(500).json({ error: "Internal server error during authentication" });
    return;
  }
};

// Middleware to authorize based on roles
export const authorizeRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In demo mode, always allow access regardless of role
    if (DEMO_MODE) {
      console.log(`DEMO MODE: Role authorization bypassed (required roles: ${allowedRoles.join(", ")})`);
      return next();
    }

    if (!req.user || !req.user.role) {
      res.status(403).json({ error: "Access forbidden: User role not found." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res
        .status(403)
        .json({ error: `Access forbidden: Requires ${allowedRoles.join(" or ")} role.` });
      return;
    }

    next(); // user has the required role
  };
};

