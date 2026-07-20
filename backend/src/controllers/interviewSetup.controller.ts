import { Request, Response, NextFunction } from "express";
import { InterviewSetupService } from "../services/interviewSetup.service";
import { UnauthorizedError } from "../utils/errors";

const setupService = new InterviewSetupService();

export class InterviewSetupController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const result = await setupService.createSetup(req.user.id, req.body);
      res.status(201).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { id } = req.params;
      const result = await setupService.getSetup(id);
      
      if (req.user.role !== "admin" && result.userId !== req.user.id) {
        throw new UnauthorizedError("Unauthorized access to this configuration");
      }

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const result = await setupService.getUserSetups(req.user.id);
      res.status(200).json({
        status: "success",
        data: {
          setups: result,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { id } = req.params;
      const checkSetup = await setupService.getSetup(id);
      if (req.user.role !== "admin" && checkSetup.userId !== req.user.id) {
        throw new UnauthorizedError("Unauthorized access to this configuration");
      }

      await setupService.deleteSetup(id);
      res.status(200).json({
        status: "success",
        message: "Configuration deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
export default InterviewSetupController;
