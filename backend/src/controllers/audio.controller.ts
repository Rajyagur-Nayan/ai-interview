import { Request, Response, NextFunction } from "express";
import { WhisperService } from "../services/whisper.service";
import { PiperTTSService } from "../services/piper.service";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

const whisperService = new WhisperService();
const piperService = new PiperTTSService();

export class AudioController {
  async transcribe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { audioBase64 } = req.body;
      if (!audioBase64) {
        throw new BadRequestError("Missing audioBase64 data in payload");
      }

      const buffer = Buffer.from(audioBase64, "base64");
      const transcript = await whisperService.transcribe(buffer);

      res.status(200).json({
        status: "success",
        data: { transcript },
      });
    } catch (error) {
      next(error);
    }
  }

  async tts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const text = req.query.text as string;
      if (!text) {
        throw new BadRequestError("Missing text query parameter");
      }

      const audioUrl = await piperService.textToSpeech(text);

      res.status(200).json({
        status: "success",
        data: { audioUrl },
      });
    } catch (error) {
      next(error);
    }
  }
}
export default AudioController;
