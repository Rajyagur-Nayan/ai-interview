import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
dotenv.config();

export class PiperTTSService {
  private ttsUrl = process.env.PIPER_TTS_URL || "";
  private cacheDir = path.join(__dirname, "../../../static/audio/tts");

  constructor() {
    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async textToSpeech(text: string): Promise<string> {
    if (!text) return "";

    // 1. Generate MD5 hash of text for caching
    const hash = crypto.createHash("md5").update(text).digest("hex");
    const filename = `${hash}.wav`;
    const cachedFilePath = path.join(this.cacheDir, filename);
    const relativeStaticUrl = `/static/audio/tts/${filename}`;

    // 2. If cached file exists, return the relative URL
    if (fs.existsSync(cachedFilePath)) {
      console.log(`[PiperTTSService] Cache hit for text: "${text.substring(0, 25)}..."`);
      return relativeStaticUrl;
    }

    console.log(`[PiperTTSService] Cache miss. Synthesizing text: "${text.substring(0, 25)}..."`);

    try {
      // 3. Attempt HTTP service synthesis if URL is set
      if (this.ttsUrl) {
        console.log(`[PiperTTSService] Calling local Piper HTTP server at: ${this.ttsUrl}`);
        const response = await axios.get(this.ttsUrl, {
          params: { text },
          responseType: "arraybuffer",
          timeout: 10000 // 10s
        });

        fs.writeFileSync(cachedFilePath, Buffer.from(response.data));
        return relativeStaticUrl;
      }

      // 4. Attempt local CLI execution if PIPER_TTS_URL is not set
      // Assumes 'piper' binary is in the system PATH and a voice model is configured
      const modelPath = process.env.PIPER_MODEL_PATH || "en_US-amy-medium.onnx";
      if (fs.existsSync(modelPath) || process.env.PIPER_CLI_FORCE === "true") {
        console.log(`[PiperTTSService] Synthesizing via local Piper CLI with model: ${modelPath}`);
        const cmd = `piper --model "${modelPath}" --output_file "${cachedFilePath}"`;
        
        // Pass the text to piper via stdin
        const child = exec(cmd, (err) => {
          if (err) console.error("[PiperTTSService] CLI execution error:", err);
        });
        
        if (child.stdin) {
          child.stdin.write(text);
          child.stdin.end();
        }

        // Wait brief moment for CLI file write
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (fs.existsSync(cachedFilePath)) {
          return relativeStaticUrl;
        }
      }
      
      console.warn("[PiperTTSService] Piper TTS server and CLI model not available. Fallback to client-side speech synthesis.");
      return ""; // Returns empty string, instructing client-side fallback to play it
    } catch (error: any) {
      console.error("[PiperTTSService] TTS synthesis failed:", error.message);
      return ""; // Fallback gracefully
    }
  }
}
export default PiperTTSService;
