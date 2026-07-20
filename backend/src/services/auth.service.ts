import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { UnauthorizedError } from "../utils/errors";
import * as dotenv from "dotenv";

dotenv.config();

const ACCESS_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "your_super_secret_access_token_key_12345";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your_super_secret_refresh_token_key_67890";

export class AuthService {
  private userRepository = new UserRepository();

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateAccessToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
  }

  generateRefreshToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, ACCESS_SECRET) as { id: string; email: string; role: "candidate" | "admin" };
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, REFRESH_SECRET) as { id: string; email: string; role: "candidate" | "admin" };
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }
}
export default AuthService;
