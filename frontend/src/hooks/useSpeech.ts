import { useState } from "react";
import { aiInterviewService, WhisperResponse } from "../services/aiInterview.service";

export function useSpeech() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcribe = async (audioBlob: Blob, questionId: string): Promise<WhisperResponse> => {
    setIsTranscribing(true);
    setError(null);
    try {
      return await aiInterviewService.transcribe(audioBlob, questionId);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to transcribe audio";
      setError(msg);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    transcribe,
    isTranscribing,
    error,
  };
}

export default useSpeech;
