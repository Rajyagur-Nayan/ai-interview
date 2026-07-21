import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

const authService = new AuthService();
const userRepository = new UserRepository();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? ("none" as const)
      : ("lax" as const),
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestError("User with this email already exists");
      }

      const passwordHash = await authService.hashPassword(password);
      const user = await userRepository.create({
        name,
        email,
        passwordHash,
        role,
      });

      res.status(201).json({
        status: "success",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError("Invalid email or password");
      }

      const isPasswordValid = await authService.comparePassword(
        password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid email or password");
      }

      const userPayload = { id: user.id, email: user.email, role: user.role };
      const accessToken = authService.generateAccessToken(userPayload);
      const refreshToken = authService.generateRefreshToken(userPayload);

      // Save refresh token to user record in DB
      await userRepository.updateRefreshToken(user.id, refreshToken);

      // Set cookie
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        status: "success",
        data: {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError("Refresh token not found");
      }

      // Verify token
      const decoded = authService.verifyRefreshToken(refreshToken);

      // Fetch user and check if matching refresh token is stored in DB
      const user = await userRepository.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        // If there's a token mismatch (e.g. token reuse or invalid token), invalidate database entry as security practice
        if (user) {
          await userRepository.updateRefreshToken(user.id, null);
        }
        res.clearCookie("refreshToken", COOKIE_OPTIONS);
        throw new UnauthorizedError("Invalid or reused refresh token");
      }

      // Refresh Token Rotation: Generate new set of tokens
      const userPayload = { id: user.id, email: user.email, role: user.role };
      const newAccessToken = authService.generateAccessToken(userPayload);
      const newRefreshToken = authService.generateRefreshToken(userPayload);

      // Update in database
      await userRepository.updateRefreshToken(user.id, newRefreshToken);

      // Set new cookie
      res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        status: "success",
        data: {
          accessToken: newAccessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        // Find user and clear refresh token
        try {
          const decoded = authService.verifyRefreshToken(refreshToken);
          await userRepository.updateRefreshToken(decoded.id, null);
        } catch (err) {
          // Token could be already expired, continue clearing cookie anyway
        }
      }

      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
      }
      const user = await userRepository.findById(req.user.id);
      if (!user) {
        throw new UnauthorizedError("User no longer exists");
      }
      res.status(200).json({
        status: "success",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default AuthController;
