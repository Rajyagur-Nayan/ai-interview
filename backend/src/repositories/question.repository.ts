import db from "../database/db";
import { questions } from "../models/schema";
import { eq } from "drizzle-orm";

export class QuestionRepository {
  async createMany(items: Omit<typeof questions.$inferInsert, "id" | "createdAt">[]) {
    return await db.insert(questions).values(items).returning();
  }

  async findByInterviewId(interviewId: string) {
    return await db.select().from(questions).where(eq(questions.interviewId, interviewId)).orderBy(questions.orderIndex);
  }

  async findById(id: string) {
    const results = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return results[0] || null;
  }

  async updateAudioUrl(id: string, audioUrl: string) {
    const results = await db.update(questions).set({ audioUrl }).where(eq(questions.id, id)).returning();
    return results[0];
  }
}
