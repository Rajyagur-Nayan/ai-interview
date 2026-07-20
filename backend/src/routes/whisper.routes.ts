import { Router } from "express";
import { WhisperController } from "../controllers/whisper.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { whisperLimiter } from "../middlewares/rateLimit.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();
const controller = new WhisperController();

router.post(
  "/transcribe",
  authenticate,
  whisperLimiter,
  upload.single("audio"),
  (req, res, next) => controller.transcribe(req, res, next)
);

export default router;
