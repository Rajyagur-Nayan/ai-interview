import { Request, Response, NextFunction } from "express";
import { AIService } from "../services/ai.service";
import { UnauthorizedError } from "../utils/errors";

const aiService = new AIService();

export class AIController {
  async questions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { role, experienceLevel, difficulty, count } = req.body;
      const result = await aiService.generateQuestions(role, experienceLevel, difficulty, count);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async followUp(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { question, answer } = req.body;
      const result = await aiService.generateFollowUp(question, answer);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async evaluate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { question, answer } = req.body;
      const result = await aiService.evaluateAnswer(question, answer);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async feedback(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { qaList } = req.body;
      const result = await aiService.generateFinalFeedback(qaList);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async report(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { qaList } = req.body;
      const result = await aiService.generateInterviewReport(qaList);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default AIController;
