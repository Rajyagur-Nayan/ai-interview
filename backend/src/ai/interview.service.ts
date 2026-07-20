import { GroqClient } from "./groq.client";
import { generateQuestionPrompt } from "./prompts/generateQuestion";
import { generateFollowUpPrompt } from "./prompts/generateFollowUp";
import { evaluateAnswerPrompt } from "./prompts/evaluateAnswer";
import { evaluateCommunicationPrompt } from "./prompts/evaluateCommunication";
import { generateReportPrompt } from "./prompts/generateReport";
import {
  QuestionListResponse,
  FollowUpResponse,
  EvaluationResponse,
  CommunicationEvaluationResponse,
  ComprehensiveReportResponse,
} from "./types";

export class InterviewService {
  constructor(private groqClient: GroqClient) {}

  private cleanJsonString(content: string): string {
    let cleaned = content.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  async generateQuestions(
    role: string,
    experienceLevel: string,
    difficulty: string,
    count = 1
  ): Promise<QuestionListResponse> {
    const prompt = generateQuestionPrompt(role, experienceLevel, difficulty, count);
    const responseText = await this.groqClient.getChatCompletion(prompt.system, prompt.user, 0.7);
    const cleaned = this.cleanJsonString(responseText);
    return JSON.parse(cleaned) as QuestionListResponse;
  }

  async generateFollowUp(question: string, answer: string): Promise<FollowUpResponse> {
    const prompt = generateFollowUpPrompt(question, answer);
    const responseText = await this.groqClient.getChatCompletion(prompt.system, prompt.user, 0.7);
    const cleaned = this.cleanJsonString(responseText);
    return JSON.parse(cleaned) as FollowUpResponse;
  }

  async evaluateAnswer(question: string, answer: string): Promise<EvaluationResponse> {
    const prompt = evaluateAnswerPrompt(question, answer);
    const responseText = await this.groqClient.getChatCompletion(prompt.system, prompt.user, 0.3);
    const cleaned = this.cleanJsonString(responseText);
    return JSON.parse(cleaned) as EvaluationResponse;
  }

  async evaluateCommunication(question: string, answer: string): Promise<CommunicationEvaluationResponse> {
    const prompt = evaluateCommunicationPrompt(question, answer);
    const responseText = await this.groqClient.getChatCompletion(prompt.system, prompt.user, 0.4);
    const cleaned = this.cleanJsonString(responseText);
    return JSON.parse(cleaned) as CommunicationEvaluationResponse;
  }

  async generateComprehensiveReport(
    role: string,
    difficulty: string,
    qaList: Array<{ question: string; answer: string; score: number; emotions: any[] }>
  ): Promise<ComprehensiveReportResponse> {
    const prompt = generateReportPrompt(role, difficulty, qaList);
    const responseText = await this.groqClient.getChatCompletion(prompt.system, prompt.user, 0.5);
    const cleaned = this.cleanJsonString(responseText);
    return JSON.parse(cleaned) as ComprehensiveReportResponse;
  }
}
export default InterviewService;
