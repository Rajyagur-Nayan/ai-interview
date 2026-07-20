import db from "../database/db";
import { interviews, questions, answers, users, interviewSetups } from "../models/schema";
import { eq, desc, sql } from "drizzle-orm";

export class InterviewRepository {
  async create(userId: string, role: string, difficulty: string, setupId?: string) {
    const results = await db.insert(interviews).values({
      userId,
      role,
      difficulty,
      setupId: setupId || null,
      status: "scheduled",
    }).returning();
    return results[0];
  }

  async findById(id: string) {
    const results = await db.select().from(interviews).where(eq(interviews.id, id)).limit(1);
    return results[0] || null;
  }

  async findByIdWithDetails(id: string) {
    const interview = await this.findById(id);
    if (!interview) return null;

    const interviewQuestions = await db.select().from(questions).where(eq(questions.interviewId, id));
    
    // Fetch answers for these questions
    const questionIds = interviewQuestions.map(q => q.id);
    let interviewAnswers: typeof answers.$inferSelect[] = [];
    if (questionIds.length > 0) {
      interviewAnswers = await db.select().from(answers).where(sql`${answers.questionId} IN (${sql.join(questionIds.map(qid => sql`${qid}`), sql`, `)})`);
    }

    const setup = interview.setupId
      ? await db.select().from(interviewSetups).where(eq(interviewSetups.id, interview.setupId)).limit(1)
      : [];
    const totalQuestions = setup && setup[0] ? setup[0].numberOfQuestions : 5;

    return {
      ...interview,
      questions: interviewQuestions,
      answers: interviewAnswers,
      totalQuestions
    };
  }

  async findByUserId(userId: string) {
    return await db.select().from(interviews).where(eq(interviews.userId, userId)).orderBy(desc(interviews.createdAt));
  }

  async updateStatus(id: string, status: "scheduled" | "in_progress" | "completed") {
    const results = await db.update(interviews).set({ status, updatedAt: new Date() }).where(eq(interviews.id, id)).returning();
    return results[0];
  }

  async updateReportData(id: string, reportData: any) {
    const results = await db.update(interviews).set({ reportData, updatedAt: new Date() }).where(eq(interviews.id, id)).returning();
    return results[0];
  }

  async getAdminAnalytics() {
    const totalInterviews = await db.select({ count: sql<number>`count(*)` }).from(interviews);
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    const averageScore = await db.select({ avg: sql<number>`avg(${answers.score})` }).from(answers);
    
    const roleStats = await db.select({
      role: interviews.role,
      count: sql<number>`count(*)`
    }).from(interviews).groupBy(interviews.role);

    return {
      totalInterviews: Number(totalInterviews[0]?.count || 0),
      totalUsers: Number(totalUsers[0]?.count || 0),
      averageScore: Math.round(Number(averageScore[0]?.avg || 0)),
      roleDistribution: roleStats
    };
  }
}
