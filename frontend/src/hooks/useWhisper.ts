import { useState } from "react";
import { whisperService, WhisperResponse } from "../services/whisper.service";

export function useWhisper() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcribe = async (audioBlob: Blob, questionId: string): Promise<WhisperResponse> => {
    setIsTranscribing(true);
    setError(null);
    try {
      const response = await whisperService.transcribe(audioBlob, questionId);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to transcribe audio";
      setError(message);
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

export default useWhisper;
