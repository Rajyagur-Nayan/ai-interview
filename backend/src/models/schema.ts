import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["candidate", "admin"]);
export const interviewStatusEnum = pgEnum("interview_status", ["scheduled", "in_progress", "completed"]);

// USERS TABLE
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("candidate").notNull(),
  refreshToken: varchar("refresh_token", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// INTERVIEW SETUPS TABLE
export const interviewSetups = pgTable("interview_setups", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  jobRole: varchar("job_role", { length: 255 }).notNull(),
  experienceLevel: varchar("experience_level", { length: 100 }).notNull(),
  difficulty: varchar("difficulty", { length: 100 }).notNull(),
  numberOfQuestions: integer("number_of_questions").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// INTERVIEWS TABLE
export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  setupId: uuid("setup_id").references(() => interviewSetups.id, { onDelete: "set null" }),
  role: varchar("role", { length: 255 }).notNull(), // e.g. Frontend Engineer, Product Manager
  difficulty: varchar("difficulty", { length: 100 }).notNull(), // e.g. Entry, Mid, Senior
  status: interviewStatusEnum("status").default("scheduled").notNull(),
  reportData: jsonb("report_data"), // AI comprehensive report cache
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// QUESTIONS TABLE
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  interviewId: uuid("interview_id").references(() => interviews.id, { onDelete: "cascade" }).notNull(),
  questionText: text("question_text").notNull(),
  orderIndex: integer("order_index").notNull(),
  audioUrl: varchar("audio_url", { length: 500 }), // Text-to-speech file path
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ANSWERS TABLE
export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  transcript: text("transcript"), // Speech-to-text transcription
  audioUrl: varchar("audio_url", { length: 500 }), // Candidate response audio file path
  evaluation: text("evaluation"), // Feedback evaluation by AI
  score: integer("score"), // Score out of 100
  emotions: jsonb("emotions"), // face-api.js emotional analysis data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RELATIONSHIPS
export const usersRelations = relations(users, ({ many }) => ({
  interviews: many(interviews),
  answers: many(answers),
  interviewSetups: many(interviewSetups),
}));

export const interviewSetupsRelations = relations(interviewSetups, ({ one, many }) => ({
  user: one(users, {
    fields: [interviewSetups.userId],
    references: [users.id],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  user: one(users, {
    fields: [interviews.userId],
    references: [users.id],
  }),
  setup: one(interviewSetups, {
    fields: [interviews.setupId],
    references: [interviewSetups.id],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  interview: one(interviews, {
    fields: [questions.interviewId],
    references: [interviews.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [answers.userId],
    references: [users.id],
  }),
}));
