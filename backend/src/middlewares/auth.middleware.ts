import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

const authService = new AuthService();

// Extend request types in this scope to handle user payloads
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "candidate" | "admin";
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Access token required"));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = authService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: Array<"candidate" | "admin">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Access forbidden: insufficient permissions"));
    }
    next();
  };
};
