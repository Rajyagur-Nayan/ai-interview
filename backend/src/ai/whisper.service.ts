import { GroqClient } from "./groq.client";
import { WhisperResponse } from "./types";

export class WhisperService {
  constructor(private groqClient: GroqClient) {}

  async transcribe(
    audioBuffer: Buffer,
    filename = "audio.wav",
    mimeType = "audio/wav"
  ): Promise<WhisperResponse> {
    try {
      const response = await this.groqClient.transcribe(audioBuffer, filename, mimeType);
      return {
        success: true,
        transcript: response.text || "",
        language: response.language || "unknown",
        duration: response.duration !== undefined ? String(response.duration) : "0",
      };
    } catch (error: any) {
      console.error("[WhisperService] Transcription failed:", error.message);
      throw error;
    }
  }
}

export default WhisperService;
