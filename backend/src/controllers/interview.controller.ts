import { Request, Response, NextFunction } from "express";
import { InterviewService } from "../services/interview.service";
import { UnauthorizedError } from "../utils/errors";

const interviewService = new InterviewService();

export class InterviewController {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const result = await interviewService.startInterview(req.user.id, req.body);
      res.status(201).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { questionId, transcript, emotions, audioBase64 } = req.body;

      let audioBuffer: Buffer | null = null;
      if (audioBase64) {
        audioBuffer = Buffer.from(audioBase64, "base64");
      }

      const result = await interviewService.submitAnswer(
        req.user.id,
        questionId,
        audioBuffer,
        transcript,
        emotions
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await interviewService.getInterviewReport(id);

      if (req.user?.role !== "admin" && result.userId !== req.user?.id) {
        throw new UnauthorizedError("Unauthorized to view this report");
      }

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const result = await interviewService.getUserHistory(req.user.id);
      res.status(200).json({
        status: "success",
        data: {
          interviews: result,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.getAdminAnalytics();
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default InterviewController;
