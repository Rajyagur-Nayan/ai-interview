import db from "../database/db";
import { answers } from "../models/schema";
import { eq, and } from "drizzle-orm";

export class AnswerRepository {
  async save(answer: typeof answers.$inferInsert) {
    // Check if answer already exists for this question
    const existing = await db.select().from(answers).where(
      and(
        eq(answers.questionId, answer.questionId),
        eq(answers.userId, answer.userId)
      )
    ).limit(1);

    if (existing.length > 0) {
      // Update
      const results = await db.update(answers)
        .set({
          transcript: answer.transcript,
          audioUrl: answer.audioUrl,
          evaluation: answer.evaluation,
          score: answer.score,
          emotions: answer.emotions,
        })
        .where(eq(answers.id, existing[0].id))
        .returning();
      return results[0];
    } else {
      // Insert
      const results = await db.insert(answers).values(answer).returning();
      return results[0];
    }
  }

  async findByQuestionAndUser(questionId: string, userId: string) {
    const results = await db.select().from(answers).where(
      and(
        eq(answers.questionId, questionId),
        eq(answers.userId, userId)
      )
    ).limit(1);
    return results[0] || null;
  }
}
