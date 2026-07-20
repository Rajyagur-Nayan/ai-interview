export interface QuestionListResponse {
  questions: string[];
}

export interface FollowUpResponse {
  followUpQuestion: string;
}

export interface EvaluationResponse {
  score: number;
  strengths: string[];
  weaknesses: string[];
  constructiveFeedback: string;
}

export interface CommunicationEvaluationResponse {
  communicationScore: number;
  clarity: string;
  structure: string;
  fillerWordsTally: number;
  feedback: string;
}

export interface ComprehensiveReportResponse {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  emotionSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface WhisperResponse {
  success: boolean;
  transcript: string;
  language: string;
  duration: string;
}
