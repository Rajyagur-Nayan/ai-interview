import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth.routes";
import interviewRoutes from "./routes/interview.routes";
import interviewSetupRoutes from "./routes/interviewSetup.routes";
import aiRoutes from "./routes/ai.routes";
import audioRoutes from "./routes/audio.routes";
import interviewAIRoutes from "./routes/interviewAI.routes";
import speechRoutes from "./routes/speech.routes";
import { loggerMiddleware } from "./middlewares/logging.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(loggerMiddleware);
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());

// Large payload limits for handling audio/video base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Static Files Serving
app.use("/static", express.static(path.join(__dirname, "../static")));

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/interviews", interviewRoutes);
app.use("/api/v1/interview-setups", interviewSetupRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/audio", audioRoutes);
app.use("/api/v1/interview", interviewAIRoutes);
app.use("/api/v1/speech", speechRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || "development"} mode on port ${port}`);
  });
}

export default app;
