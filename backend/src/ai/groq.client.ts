import axios, { AxiosInstance } from "axios";
import { AppError } from "../utils/errors";

export class GroqClient {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("[GroqClient] GROQ_API_KEY is not set in environment.");
    }

    this.client = axios.create({
      baseURL: "https://api.groq.com/openai/v1",
      headers: {
        Authorization: `Bearer ${apiKey || ""}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds
    });
  }

  private async callWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.response?.status === 429 || error.message?.includes("429");
      const isServerErr = error.response?.status >= 500 || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

      if ((isRateLimit || isServerErr) && retries > 0) {
        console.warn(`[GroqClient] API request failed. Retrying in ${delayMs}ms. Retries left: ${retries}. Reason: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.callWithRetry(fn, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  async getChatCompletion(systemPrompt: string, userPrompt: string, temperature = 0.5): Promise<string> {
    const requestFn = async () => {
      const response = await this.client.post("/chat/completions", {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        response_format: { type: "json_object" },
      });
      return response.data.choices[0].message.content;
    };

    try {
      return await this.callWithRetry(requestFn);
    } catch (error: any) {
      console.error("[GroqClient] Chat completion failed:", error.response?.data || error.message);
      const status = error.response?.status || 502;
      const message = error.response?.data?.error?.message || error.message || "Groq LLM call failed";
      throw new AppError(`Groq Chat Completion Failed: ${message}`, status);
    }
  }

  async transcribe(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    model = "whisper-large-v3"
  ) {
    const requestFn = async () => {
      const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
      
      const bodyBuffer = Buffer.concat([
        Buffer.from([
          `--${boundary}`,
          `Content-Disposition: form-data; name="model"`,
          "",
          model,
          `--${boundary}`,
          `Content-Disposition: form-data; name="response_format"`,
          "",
          "verbose_json",
          `--${boundary}`,
          `Content-Disposition: form-data; name="file"; filename="${filename}"`,
          `Content-Type: ${mimeType}`,
          "",
          ""
        ].join("\r\n"), "utf-8"),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8")
      ]);

      const response = await this.client.post("/audio/transcriptions", bodyBuffer, {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      });

      return response.data;
    };

    try {
      return await this.callWithRetry(requestFn);
    } catch (error: any) {
      console.error("[GroqClient] Transcription failed:", error.response?.data || error.message);
      const status = error.response?.status || 502;
      const message = error.response?.data?.error?.message || error.message || "Groq transcription failed";
      throw new AppError(`Groq Transcription Failed: ${message}`, status);
    }
  }
}

export const groqClient = new GroqClient();
export default groqClient;
