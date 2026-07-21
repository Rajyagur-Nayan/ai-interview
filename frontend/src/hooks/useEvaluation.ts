import { useState } from "react";
import { aiInterviewService, EvaluationResponse } from "../services/aiInterview.service";
import type { ComposureLogItem } from "./useEmotionDetection";

export function useEvaluation() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = async (questionId: string, transcript: string, emotions: ComposureLogItem[] = []): Promise<EvaluationResponse> => {
    setIsEvaluating(true);
    setError(null);
    try {
      return await aiInterviewService.evaluate(questionId, transcript, emotions);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || "Failed to evaluate response";
      setError(msg);
      throw err;
    } finally {
      setIsEvaluating(false);
    }
  };

  return {
    evaluate,
    isEvaluating,
    error,
  };
}

export default useEvaluation;
