import { Router } from "express";
import { InterviewController } from "../controllers/interview.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { startInterviewSchema, answerSubmissionSchema } from "../validators/interview.validator";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { apiLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();
const controller = new InterviewController();

router.post("/start", authenticate, apiLimiter, validateRequest(startInterviewSchema), (req, res, next) => controller.start(req, res, next));
router.post("/submit", authenticate, apiLimiter, validateRequest(answerSubmissionSchema), (req, res, next) => controller.submit(req, res, next));
router.get("/history", authenticate, (req, res, next) => controller.getHistory(req, res, next));
router.get("/analytics", authenticate, authorize(["admin"]), (req, res, next) => controller.getAnalytics(req, res, next));
router.get("/report/:id", authenticate, (req, res, next) => controller.getReport(req, res, next));

export default router;
