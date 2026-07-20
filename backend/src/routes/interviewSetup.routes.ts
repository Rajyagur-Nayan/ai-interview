import { Router } from "express";
import { InterviewSetupController } from "../controllers/interviewSetup.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { createInterviewSetupSchema } from "../validators/interviewSetup.validator";
import { authenticate } from "../middlewares/auth.middleware";
import { apiLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();
const controller = new InterviewSetupController();

router.post("/", authenticate, apiLimiter, validateRequest(createInterviewSetupSchema), (req, res, next) => controller.create(req, res, next));
router.get("/", authenticate, (req, res, next) => controller.list(req, res, next));
router.get("/:id", authenticate, (req, res, next) => controller.get(req, res, next));
router.delete("/:id", authenticate, (req, res, next) => controller.delete(req, res, next));

export default router;
