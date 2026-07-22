import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { authLimiter } from "../middlewares/rateLimit.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
const controller = new AuthController();

router.post("/register", authLimiter, validateRequest(registerSchema), (req, res, next) => controller.register(req, res, next));
router.post("/login", authLimiter, validateRequest(loginSchema), (req, res, next) => controller.login(req, res, next));
router.post("/refresh", (req, res, next) => controller.refresh(req, res, next));
router.post("/logout", (req, res, next) => controller.logout(req, res, next));
router.get("/me", (req, res, next) => controller.getMe(req, res, next));

export default router;
