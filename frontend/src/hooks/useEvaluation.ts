import { useState } from "react";
import { aiInterviewService, EvaluationResponse } from "../services/aiInterview.service";

export function useEvaluation() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = async (questionId: string, transcript: string, emotions: any[] = []): Promise<EvaluationResponse> => {
    setIsEvaluating(true);
    setError(null);
    try {
      return await aiInterviewService.evaluate(questionId, transcript, emotions);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to evaluate response";
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
