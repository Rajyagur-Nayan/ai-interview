import { Router } from "express";
import { AudioController } from "../controllers/audio.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { apiLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();
const controller = new AudioController();

router.post("/transcribe", authenticate, apiLimiter, (req, res, next) => controller.transcribe(req, res, next));
router.get("/tts", authenticate, apiLimiter, (req, res, next) => controller.tts(req, res, next));

export default router;
