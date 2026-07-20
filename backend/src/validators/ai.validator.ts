import { z } from "zod";

export const generateQuestionsSchema = z.object({
  role: z.string().min(1, "Role is required"),
  experienceLevel: z.string().min(1, "Experience level is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  count: z.number().int().min(1).max(20).optional().default(5),
});

export const generateFollowUpSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const evaluateAnswerSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const generateFeedbackSchema = z.object({
  qaList: z.array(
    z.object({
      question: z.string().min(1, "Question is required"),
      answer: z.string().min(1, "Answer is required"),
      score: z.number().optional(),
    })
  ).min(1, "At least one question-answer pair is required"),
});

export const generateReportSchema = z.object({
  qaList: z.array(
    z.object({
      question: z.string().min(1, "Question is required"),
      answer: z.string().min(1, "Answer is required"),
      score: z.number().min(0).max(100, "Score must be between 0 and 100"),
      evaluation: z.string().min(1, "Evaluation feedback is required"),
    })
  ).min(1, "At least one question-answer evaluation is required"),
});
