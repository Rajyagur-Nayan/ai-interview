import db from "../database/db";
import { users } from "../models/schema";
import { eq } from "drizzle-orm";

export class UserRepository {
  async findByEmail(email: string) {
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return results[0] || null;
  }

  async findById(id: string) {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] || null;
  }

  async create(user: Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async updateRefreshToken(id: string, token: string | null) {
    const results = await db.update(users).set({ refreshToken: token, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return results[0];
  }

  async getAllUsers() {
    return await db.select().from(users);
  }
}
