import { z } from "zod";

export const createInterviewSetupSchema = z.object({
  jobRole: z.string().min(1, "Job role is required").max(255),
  experienceLevel: z.string().min(1, "Experience level is required").max(100),
  difficulty: z.string().min(1, "Difficulty is required").max(100),
  numberOfQuestions: z.number().int().min(1, "Must have at least 1 question").max(20, "Cannot exceed 20 questions").default(5),
});

export type CreateInterviewSetupDTO = z.infer<typeof createInterviewSetupSchema>;
