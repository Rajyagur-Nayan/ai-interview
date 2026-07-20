import { Router } from "express";
import { InterviewAIController } from "../controllers/interviewAI.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { aiQueryLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();
const controller = new InterviewAIController();

router.post("/question", authenticate, aiQueryLimiter, (req, res, next) => controller.generateQuestion(req, res, next));
router.post("/evaluate", authenticate, aiQueryLimiter, (req, res, next) => controller.evaluate(req, res, next));
router.post("/follow-up", authenticate, aiQueryLimiter, (req, res, next) => controller.generateFollowUp(req, res, next));
router.post("/report", authenticate, aiQueryLimiter, (req, res, next) => controller.generateReport(req, res, next));

export default router;
