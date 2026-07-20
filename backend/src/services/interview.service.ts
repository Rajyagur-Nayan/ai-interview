import { InterviewRepository } from "../repositories/interview.repository";
import { QuestionRepository } from "../repositories/question.repository";
import { AnswerRepository } from "../repositories/answer.repository";
import { AIService } from "./ai.service";
import { InterviewSetupService } from "./interviewSetup.service";
import { NotFoundError, BadRequestError, UnauthorizedError } from "../utils/errors";
import { saveAudioFile } from "../utils/audioStorage";

export class InterviewService {
  private interviewRepo = new InterviewRepository();
  private questionRepo = new QuestionRepository();
  private answerRepo = new AnswerRepository();
  private aiService = new AIService();
  private setupService = new InterviewSetupService();

  async startInterview(
    userId: string,
    params: {
      setupId?: string;
      role?: string;
      experienceLevel?: string;
      difficulty?: string;
      numberOfQuestions?: number;
    }
  ) {
    let jobRole = "";
    let experienceLevel = "";
    let difficulty = "";
    let numberOfQuestions = 5;
    let setupIdToUse: string | undefined = undefined;

    if (params.setupId) {
      // 1. Fetch existing setup
      const setup = await this.setupService.getSetup(params.setupId);
      if (setup.userId !== userId) {
        throw new UnauthorizedError("Unauthorized access to this configuration");
      }
      jobRole = setup.jobRole;
      experienceLevel = setup.experienceLevel;
      difficulty = setup.difficulty;
      numberOfQuestions = setup.numberOfQuestions;
      setupIdToUse = setup.id;
    } else {
      // 2. Validate inline configuration parameter and create implicitly
      jobRole = params.role || "Frontend Engineer";
      experienceLevel = params.experienceLevel || "Mid Level";
      difficulty = params.difficulty || "Medium";
      numberOfQuestions = params.numberOfQuestions || 5;

      const newSetup = await this.setupService.createSetup(userId, {
        jobRole,
        experienceLevel,
        difficulty,
        numberOfQuestions,
      });
      setupIdToUse = newSetup.id;
    }

    // 3. Generate initial question using Grok AI
    const questionsList = await this.aiService.generateQuestions(
      jobRole,
      experienceLevel,
      difficulty,
      1
    );
    
    // 4. Create Interview record linking to setupId
    const interview = await this.interviewRepo.create(userId, jobRole, difficulty, setupIdToUse);

    // 5. Save Initial Question to DB
    const firstQuestionText = questionsList[0] || `Explain how you handle asynchronous operations in ${jobRole}.`;
    const questionsToInsert = [{
      interviewId: interview.id,
      questionText: firstQuestionText,
      orderIndex: 0,
      audioUrl: null, // TTS audio url can be generated if needed
    }];
    const savedQuestions = await this.questionRepo.createMany(questionsToInsert);

    // Background Text-to-Speech generation pre-caching
    for (const q of savedQuestions) {
      this.aiService.textToSpeech(q.questionText).then((audioUrl) => {
        if (audioUrl) {
          this.questionRepo.updateAudioUrl(q.id, audioUrl).catch((err) => {
            console.error(`[InterviewService] Failed to update TTS audio URL for question ${q.id}:`, err);
          });
        }
      }).catch((err) => {
        console.error(`[InterviewService] TTS pre-synthesis failed for question ${q.id}:`, err);
      });
    }

    // 6. Update status to in_progress
    const updatedInterview = await this.interviewRepo.updateStatus(interview.id, "in_progress");

    return {
      interview: updatedInterview,
      questions: savedQuestions,
    };
  }

  async submitAnswer(
    userId: string,
    questionId: string,
    audioBuffer: Buffer | null,
    textTranscript: string | undefined,
    emotions: any[] | undefined
  ) {
    // 1. Find the question
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    // 2. Get transcription (via Whisper or direct text fallback)
    let transcript = textTranscript || "";
    if (!transcript && audioBuffer) {
      transcript = await this.aiService.speechToText(audioBuffer);
    }

    if (!transcript) {
      throw new BadRequestError("Answer transcript or audio file is required");
    }

    // 3. Evaluate using Grok LLM
    const evaluation = await this.aiService.evaluateAnswer(question.questionText, transcript);

    // Save recorded audio file to disk and generate dynamic URL
    let savedAudioUrl: string | null = null;
    if (audioBuffer) {
      savedAudioUrl = saveAudioFile(userId, questionId, audioBuffer);
    }

    // 4. Save Answer
    const answer = await this.answerRepo.save({
      id: undefined as any, // default uuid
      questionId,
      userId,
      transcript,
      audioUrl: savedAudioUrl,
      evaluation: evaluation.feedback,
      score: evaluation.score,
      emotions: emotions || null,
      createdAt: new Date(),
    });

    // 5. Retrieve total number of questions configured
    const interview = await this.interviewRepo.findById(question.interviewId);
    if (!interview) {
      throw new NotFoundError("Interview session not found");
    }

    let totalQuestions = 5;
    if (interview.setupId) {
      try {
        const setup = await this.setupService.getSetup(interview.setupId);
        if (setup) {
          totalQuestions = setup.numberOfQuestions;
        }
      } catch (err) {
        console.error(`[InterviewService] Failed to fetch setup for interview ${interview.id}:`, err);
      }
    }

    // 6. Check how many questions have been answered so far
    const allQuestions = await this.questionRepo.findByInterviewId(question.interviewId);
    const completedAnswers: any[] = [];
    for (const q of allQuestions) {
      const ans = await this.answerRepo.findByQuestionAndUser(q.id, userId);
      if (ans) {
        completedAnswers.push(ans);
      }
    }
    const answeredCount = completedAnswers.length;

    const allFinished = answeredCount >= totalQuestions;
    if (allFinished) {
      await this.interviewRepo.updateStatus(question.interviewId, "completed");

      // Compile questions, answers, and biometrics
      const qaListForReport = allQuestions.map((q) => {
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

      try {
        const report = await this.aiService.generateComprehensiveReport(
          interview.role,
          interview.difficulty,
          qaListForReport
        );
        await this.interviewRepo.updateReportData(interview.id, report);
      } catch (err) {
        console.error(`[InterviewService] Failed to generate comprehensive report for ${interview.id}:`, err);
      }
    } else {
      // Generate follow-up question dynamically
      let followUpQuestionText = "";
      try {
        followUpQuestionText = await this.aiService.generateFollowUp(question.questionText, transcript);
      } catch (err) {
        console.error("[InterviewService] Failed to generate follow-up question, using fallback:", err);
        followUpQuestionText = "Could you elaborate on the security and performance implications of your design choice?";
      }

      // Save new follow-up question
      const nextOrderIndex = allQuestions.length; // e.g. if we have 1 question in DB, next index is 1.
      const [savedQuestion] = await this.questionRepo.createMany([{
        interviewId: question.interviewId,
        questionText: followUpQuestionText,
        orderIndex: nextOrderIndex,
        audioUrl: null,
      }]);

      // Trigger background TTS generation for the new question
      this.aiService.textToSpeech(savedQuestion.questionText).then((audioUrl) => {
        if (audioUrl) {
          this.questionRepo.updateAudioUrl(savedQuestion.id, audioUrl).catch((err) => {
            console.error(`[InterviewService] Failed to update TTS audio URL for question ${savedQuestion.id}:`, err);
          });
        }
      }).catch((err) => {
        console.error(`[InterviewService] TTS pre-synthesis failed for follow-up question ${savedQuestion.id}:`, err);
      });
    }

    return {
      answer,
      interviewFinished: allFinished,
    };
  }

  async getInterviewReport(interviewId: string) {
    const report = await this.interviewRepo.findByIdWithDetails(interviewId);
    if (!report) {
      throw new NotFoundError("Interview report not found");
    }
    return report;
  }

  async getUserHistory(userId: string) {
    return await this.interviewRepo.findByUserId(userId);
  }

  async getAdminAnalytics() {
    return await this.interviewRepo.getAdminAnalytics();
  }
}
export default InterviewService;
