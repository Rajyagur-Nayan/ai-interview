import { Request, Response, NextFunction } from "express";
import { aiInterviewService } from "../ai";
import { QuestionRepository } from "../repositories/question.repository";
import { AnswerRepository } from "../repositories/answer.repository";
import { InterviewRepository } from "../repositories/interview.repository";
import { PiperTTSService } from "../services/piper.service";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/errors";
import { z } from "zod";

const questionRepo = new QuestionRepository();
const answerRepo = new AnswerRepository();
const interviewRepo = new InterviewRepository();
const piperService = new PiperTTSService();

const questionBodySchema = z.object({
  role: z.string().min(1, "Role is required"),
  experienceLevel: z.string().min(1, "Experience level is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  count: z.number().int().min(1).max(15).optional().default(1),
});

const evaluateBodySchema = z.object({
  questionId: z.string().uuid("Invalid question ID format"),
  transcript: z.string().min(1, "Transcript text is required"),
  emotions: z.array(z.any()).optional().default([]),
});

const followUpBodySchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  transcript: z.string().min(1, "Transcript text is required"),
  interviewId: z.string().uuid("Invalid interview ID format"),
});

const reportBodySchema = z.object({
  interviewId: z.string().uuid("Invalid interview ID format"),
});

export class InterviewAIController {
  // 1. Generate Interview Question
  async generateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = questionBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.errors.map(e => e.message).join(", "));
      }

      const { role, experienceLevel, difficulty, count } = parsed.data;
      const result = await aiInterviewService.generateQuestions(role, experienceLevel, difficulty, count);

      res.status(200).json({
        success: true,
        questions: result.questions,
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Evaluate Answer
  async evaluate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const parsed = evaluateBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.errors.map(e => e.message).join(", "));
      }

      const { questionId, transcript, emotions } = parsed.data;
      const userId = req.user.id;

      const question = await questionRepo.findById(questionId);
      if (!question) {
        throw new NotFoundError("Question not found");
      }

      // Execute technical evaluation and communication evaluation in parallel
      const [evalResult, commResult] = await Promise.all([
        aiInterviewService.evaluateAnswer(question.questionText, transcript),
        aiInterviewService.evaluateCommunication(question.questionText, transcript),
      ]);

      const feedback = `${evalResult.constructiveFeedback}\n\nCommunication Assessment:\n- Score: ${commResult.communicationScore}/100\n- Clarity: ${commResult.clarity}\n- Structure: ${commResult.structure}\n- Filler Words: ~${commResult.fillerWordsTally}\n- Critique: ${commResult.feedback}`;
      const avgScore = Math.round((evalResult.score + commResult.communicationScore) / 2);

      // Save evaluation to database
      const answer = await answerRepo.save({
        id: undefined as any,
        questionId,
        userId,
        transcript,
        evaluation: feedback,
        score: avgScore,
        emotions: emotions || null,
        createdAt: new Date(),
      });

      res.status(200).json({
        success: true,
        evaluation: {
          score: avgScore,
          strengths: evalResult.strengths,
          weaknesses: evalResult.weaknesses,
          constructiveFeedback: feedback,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 3. Generate Follow-up Question
  async generateFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = followUpBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.errors.map(e => e.message).join(", "));
      }

      const { questionText, transcript, interviewId } = parsed.data;
      const result = await aiInterviewService.generateFollowUp(questionText, transcript);

      // Save question to database
      const allQuestions = await questionRepo.findByInterviewId(interviewId);
      const nextOrderIndex = allQuestions.length;

      const [savedQuestion] = await questionRepo.createMany([{
        interviewId,
        questionText: result.followUpQuestion,
        orderIndex: nextOrderIndex,
        audioUrl: null,
      }]);

      // Pre-synthesize TTS audio in background
      piperService.textToSpeech(result.followUpQuestion).then((audioUrl) => {
        if (audioUrl) {
          questionRepo.updateAudioUrl(savedQuestion.id, audioUrl).catch((err) => {
            console.error(`[InterviewAIController] Failed to update TTS URL for question ${savedQuestion.id}:`, err);
          });
        }
      }).catch((err) => {
        console.error(`[InterviewAIController] TTS pre-synthesis failed for question ${savedQuestion.id}:`, err);
      });

      res.status(200).json({
        success: true,
        followUpQuestion: result.followUpQuestion,
      });
    } catch (error) {
      next(error);
    }
  }

  // 4. Generate Final Report
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const parsed = reportBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.errors.map(e => e.message).join(", "));
      }

      const { interviewId } = parsed.data;
      const interview = await interviewRepo.findById(interviewId);
      if (!interview) {
        throw new NotFoundError("Interview session not found");
      }

      const allQuestions = await questionRepo.findByInterviewId(interviewId);
      const completedAnswers: any[] = [];
      for (const q of allQuestions) {
        const ans = await answerRepo.findByQuestionAndUser(q.id, req.user.id);
        if (ans) {
          completedAnswers.push(ans);
        }
      }

      const qaList = allQuestions.map((q) => {
        const ans = completedAnswers.find((a) => a.questionId === q.id) || {
          transcript: "No response recorded.",
          score: 0,
          emotions: [],
        };
        return {
          question: q.questionText,
          answer: ans.transcript || "No response recorded.",
          score: ans.score || 0,
          emotions: ans.emotions || [],
        };
      });

      const report = await aiInterviewService.generateComprehensiveReport(
        interview.role,
        interview.difficulty,
        qaList
      );

      // Save report and mark interview as completed
      await interviewRepo.updateReportData(interviewId, report);
      await interviewRepo.updateStatus(interviewId, "completed");

      res.status(200).json({
        success: true,
        report,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default InterviewAIController;
