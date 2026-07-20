import api from "./api";

export interface QuestionResponse {
  success: boolean;
  questions: string[];
}

export interface EvaluationResponse {
  success: boolean;
  evaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    constructiveFeedback: string;
  };
}

export interface FollowUpResponse {
  success: boolean;
  followUpQuestion: string;
}

export interface ReportResponse {
  success: boolean;
  report: {
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    emotionSummary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

export interface WhisperResponse {
  success: boolean;
  transcript: string;
  language: string;
  duration: string;
}

export const aiInterviewService = {
  async generateQuestion(
    role: string,
    experienceLevel: string,
    difficulty: string,
    count = 1
  ): Promise<QuestionResponse> {
    const response = await api.post<QuestionResponse>("/interview/question", {
      role,
      experienceLevel,
      difficulty,
      count,
    });
    return response.data;
  },

  async evaluate(questionId: string, transcript: string, emotions: any[] = []): Promise<EvaluationResponse> {
    const response = await api.post<EvaluationResponse>("/interview/evaluate", {
      questionId,
      transcript,
      emotions,
    });
    return response.data;
  },

  async generateFollowUp(questionText: string, transcript: string, interviewId: string): Promise<FollowUpResponse> {
    const response = await api.post<FollowUpResponse>("/interview/follow-up", {
      questionText,
      transcript,
      interviewId,
    });
    return response.data;
  },

  async generateReport(interviewId: string): Promise<ReportResponse> {
    const response = await api.post<ReportResponse>("/interview/report", {
      interviewId,
    });
    return response.data;
  },

  async transcribe(audioBlob: Blob, questionId: string): Promise<WhisperResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");
    formData.append("questionId", questionId);

    const response = await api.post<WhisperResponse>("/speech/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default aiInterviewService;
