import { useState } from "react";
import { aiInterviewService } from "../services/aiInterview.service";
import type { WhisperResponse } from "../services/aiInterview.service";

export function useSpeech() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcribe = async (audioBlob: Blob, questionId: string): Promise<WhisperResponse> => {
    setIsTranscribing(true);
    setError(null);
    try {
      return await aiInterviewService.transcribe(audioBlob, questionId);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || "Failed to transcribe audio";
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
