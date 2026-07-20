import { z } from "zod";

export const startInterviewSchema = z.object({
  setupId: z.string().uuid("Invalid setup ID").optional(),
  role: z.string().min(1, "Role is required").optional(),
  experienceLevel: z.string().min(1, "Experience level is required").optional(),
  difficulty: z.string().min(1, "Difficulty is required").optional(),
  numberOfQuestions: z.number().int().min(1).max(20).optional(),
}).refine(
  (data) => data.setupId || (data.role && data.difficulty && data.experienceLevel),
  {
    message: "Either setupId or configuration (role, difficulty, experienceLevel) is required",
    path: ["setupId"],
  }
);

export const answerSubmissionSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  transcript: z.string().optional(),
  audioUrl: z.string().optional(),
  audioBase64: z.string().optional(),
  emotions: z.array(z.any()).optional(), // array of face emotion metrics
});

export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type AnswerSubmissionInput = z.infer<typeof answerSubmissionSchema>;
