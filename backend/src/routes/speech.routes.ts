import { Router } from "express";
import { SpeechController } from "../controllers/speech.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { whisperLimiter } from "../middlewares/rateLimit.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();
const controller = new SpeechController();

router.post(
  "/transcribe",
  authenticate,
  whisperLimiter,
  upload.single("audio"),
  (req, res, next) => controller.transcribe(req, res, next)
);

export default router;
