import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  generateQuestionsSchema,
  generateFollowUpSchema,
  evaluateAnswerSchema,
  generateFeedbackSchema,
  generateReportSchema,
} from "../validators/ai.validator";
import { authenticate } from "../middlewares/auth.middleware";
import { aiQueryLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();
const controller = new AIController();

router.post(
  "/questions",
  authenticate,
  aiQueryLimiter,
  validateRequest(generateQuestionsSchema),
  (req, res, next) => controller.questions(req, res, next)
);

router.post(
  "/follow-up",
  authenticate,
  aiQueryLimiter,
  validateRequest(generateFollowUpSchema),
  (req, res, next) => controller.followUp(req, res, next)
);

router.post(
  "/evaluate",
  authenticate,
  aiQueryLimiter,
  validateRequest(evaluateAnswerSchema),
  (req, res, next) => controller.evaluate(req, res, next)
);

router.post(
  "/feedback",
  authenticate,
  aiQueryLimiter,
  validateRequest(generateFeedbackSchema),
  (req, res, next) => controller.feedback(req, res, next)
);

router.post(
  "/report",
  authenticate,
  aiQueryLimiter,
  validateRequest(generateReportSchema),
  (req, res, next) => controller.report(req, res, next)
);

export default router;
