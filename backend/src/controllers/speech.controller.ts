import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import { aiWhisperService } from "../ai";
import { AnswerRepository } from "../repositories/answer.repository";
import { saveAudioFile } from "../utils/audioStorage";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { z } from "zod";

const answerRepo = new AnswerRepository();

const transcribeBodySchema = z.object({
  questionId: z.string().uuid("Invalid question ID format"),
});

export class SpeechController {
  async transcribe(req: Request, res: Response, next: NextFunction) {
    const tempFilePath = req.file?.path;

    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!req.file) {
        throw new BadRequestError("Audio file is required");
      }

      // Validate body parameters
      const parsedBody = transcribeBodySchema.safeParse(req.body);
      if (!parsedBody.success) {
        const errorMsg = parsedBody.error.errors.map((e) => e.message).join(", ");
        throw new BadRequestError(errorMsg);
      }

      const { questionId } = parsedBody.data;
      const userId = req.user.id;

      // Read temp file into buffer
      const audioBuffer = fs.readFileSync(req.file.path);

      // Transcribe via Groq Whisper API
      const result = await aiWhisperService.transcribe(
        audioBuffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Save audio permanently and get relative URL
      const savedAudioUrl = saveAudioFile(userId, questionId, audioBuffer);

      // Save transcript & audio URL to database
      await answerRepo.save({
        id: undefined as any,
        questionId,
        userId,
        transcript: result.transcript,
        audioUrl: savedAudioUrl,
        createdAt: new Date(),
      });

      res.status(200).json({
        success: true,
        transcript: result.transcript,
        language: result.language,
        duration: result.duration,
      });
    } catch (error) {
      next(error);
    } finally {
      // Clean up multer temporary file upload
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.error(`[SpeechController] Failed to delete temp file ${tempFilePath}:`, unlinkError);
        }
      }
    }
  }
}

export default SpeechController;
