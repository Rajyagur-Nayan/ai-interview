import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // Limit each IP to 30 requests per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 100, // Limit each IP to 100 requests per minute
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests. Please slow down.",
  },
});

export const aiQueryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 15, // Limit each IP to 15 requests per minute
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many AI request queries. Please try again in a minute.",
  },
});

export const whisperLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 15, // Limit each IP to 15 transcription requests per minute
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many transcription requests. Please slow down and try again in a minute.",
  },
});
