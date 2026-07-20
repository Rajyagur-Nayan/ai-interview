import groqClient from "../utils/groqClient";

export interface WhisperServiceResponse {
  transcript: string;
  duration: string;
  language: string;
}

export class WhisperService {
  async transcribe(
    audioBuffer: Buffer,
    filename = "audio.wav",
    mimeType = "audio/wav"
  ): Promise<WhisperServiceResponse> {
    try {
      const response = await groqClient.transcribe(audioBuffer, filename, mimeType);
      return {
        transcript: response.text || "",
        duration: response.duration !== undefined ? String(response.duration) : "0",
        language: response.language || "unknown",
      };
    } catch (error: any) {
      console.error("[WhisperService] Transcription failed:", error.message);
      throw error;
    }
  }
}

export default WhisperService;
