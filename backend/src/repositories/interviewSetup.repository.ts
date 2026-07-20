import db from "../database/db";
import { interviewSetups } from "../models/schema";
import { eq, desc } from "drizzle-orm";

export class InterviewSetupRepository {
  async create(userId: string, data: { jobRole: string; experienceLevel: string; difficulty: string; numberOfQuestions: number }) {
    const results = await db.insert(interviewSetups).values({
      userId,
      jobRole: data.jobRole,
      experienceLevel: data.experienceLevel,
      difficulty: data.difficulty,
      numberOfQuestions: data.numberOfQuestions,
    }).returning();
    return results[0];
  }

  async findById(id: string) {
    const results = await db.select().from(interviewSetups).where(eq(interviewSetups.id, id)).limit(1);
    return results[0] || null;
  }

  async findByUserId(userId: string) {
    return await db
      .select()
      .from(interviewSetups)
      .where(eq(interviewSetups.userId, userId))
      .orderBy(desc(interviewSetups.createdAt));
  }

  async delete(id: string) {
    const results = await db.delete(interviewSetups).where(eq(interviewSetups.id, id)).returning();
    return results[0] || null;
  }
}
