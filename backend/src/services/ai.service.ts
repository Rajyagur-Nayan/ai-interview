import { aiInterviewService, aiWhisperService } from "../ai";
import { PiperTTSService } from "./piper.service";
import { ComprehensiveReportResponse } from "../ai/types";

export class AIService {
  private interviewService = aiInterviewService;
  private whisperService = aiWhisperService;
  private piperService = new PiperTTSService();

  async generateQuestions(role: string, experienceLevel: string, difficulty: string, numberOfQuestions: number): Promise<string[]> {
    const response = await this.interviewService.generateQuestions(role, experienceLevel, difficulty, numberOfQuestions);
    return response.questions;
  }

  async evaluateAnswer(questionText: string, transcript: string): Promise<{ score: number; feedback: string }> {
    const res = await this.interviewService.evaluateAnswer(questionText, transcript);
    // Format the structured feedback details for the legacy consumer
    const feedback = `${res.constructiveFeedback}\n\nStrengths:\n${res.strengths.map(s => `- ${s}`).join("\n")}\n\nWeaknesses:\n${res.weaknesses.map(w => `- ${w}`).join("\n")}`;
    return {
      score: res.score,
      feedback: feedback
    };
  }

  async generateFollowUp(questionText: string, transcript: string): Promise<string> {
    const res = await this.interviewService.generateFollowUp(questionText, transcript);
    return res.followUpQuestion;
  }

  async speechToText(audioBuffer: Buffer): Promise<string> {
    const result = await this.whisperService.transcribe(audioBuffer);
    return result.transcript;
  }

  async textToSpeech(text: string): Promise<string> {
    return await this.piperService.textToSpeech(text);
  }

  async generateComprehensiveReport(
    role: string,
    difficulty: string,
    qaList: Array<{ question: string; answer: string; score: number; emotions: any[] }>
  ): Promise<ComprehensiveReportResponse> {
    return await this.interviewService.generateComprehensiveReport(role, difficulty, qaList);
  }

  async generateFinalFeedback(qaList: Array<{ question: string; answer: string; score?: number }>): Promise<ComprehensiveReportResponse> {
    const mappedQaList = qaList.map(item => ({
      question: item.question,
      answer: item.answer,
      score: item.score || 70,
      emotions: []
    }));
    return await this.generateComprehensiveReport("General Candidate", "Medium", mappedQaList);
  }

  async generateInterviewReport(qaList: Array<{ question: string; answer: string; score: number; evaluation: string }>): Promise<ComprehensiveReportResponse> {
    const mappedQaList = qaList.map(item => ({
      question: item.question,
      answer: item.answer,
      score: item.score,
      emotions: []
    }));
    return await this.generateComprehensiveReport("General Candidate", "Medium", mappedQaList);
  }
}
export default AIService;
