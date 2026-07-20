import api from "./api";

export interface WhisperResponse {
  success: boolean;
  transcript: string;
  duration: string;
  language: string;
}

export const whisperService = {
  async transcribe(audioBlob: Blob, questionId: string): Promise<WhisperResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");
    formData.append("questionId", questionId);

    const response = await api.post<WhisperResponse>("/whisper/transcribe", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};

export default whisperService;
