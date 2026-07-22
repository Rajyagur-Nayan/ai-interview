"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FrameResultData } from "../types/worker";
import { InterviewBehaviorMetrics } from "../types/behavior";
import { ExpressionResult } from "../types/expressions";
import { AnswerAnalyticsSummary } from "../types/analytics";

export interface UseBehaviorAnalysisOptions {
  cameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  analysisFps?: number; // Configurable FPS (default 5 FPS)
}

const DEFAULT_METRICS: InterviewBehaviorMetrics = {
  confidence: 0,
  attention: 0,
  engagement: 0,
  nervousness: 0,
  confusion: 0,
  eyeContact: 0,
  focus: 0,
  faceStability: 0,
  smilePercentage: 0,
};

const DEFAULT_EXPRESSIONS: ExpressionResult = {
  smileScore: 0,
  isSmiling: false,
  isBlinking: false,
  blinkRatePerMin: 0,
  isMouthOpen: false,
  isEyeContact: false,
  gazeDirection: "center",
  headPose: { pitch: 0, yaw: 0, roll: 0, isStable: true },
  isEyebrowRaised: false,
  isFrowning: false,
  visibilityStatus: "missing",
};

export function useBehaviorAnalysis({
  cameraActive,
  videoRef,
  analysisFps = 5,
}: UseBehaviorAnalysisOptions) {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<InterviewBehaviorMetrics>(DEFAULT_METRICS);
  const [liveExpressions, setLiveExpressions] = useState<ExpressionResult>(DEFAULT_EXPRESSIONS);
  const [faceStatus, setFaceStatus] = useState<"visible" | "missing" | "occluded" | "out_of_frame">("missing");

  const workerRef = useRef<Worker | null>(null);
  const isProcessingFrameRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Local Memory buffer for answer tracking
  const isTrackingAnswerRef = useRef(false);
  const currentQuestionIdRef = useRef<string | null>(null);
  const answerStartTimeRef = useRef<number>(0);
  const answerBufferRef = useRef<{
    metrics: InterviewBehaviorMetrics;
    expressions: ExpressionResult;
    timestamp: number;
  }[]>([]);

  // 1. Initialize Web Worker
  useEffect(() => {
    let workerInstance: Worker | null = null;

    try {
      workerInstance = new Worker(
        new URL("../workers/faceLandmarker.worker.ts", import.meta.url),
        { type: "module" }
      );
      workerRef.current = workerInstance;

      workerInstance.onmessage = (event) => {
        const msg = event.data;

        if (msg.type === "INITIALIZED") {
          if (msg.success) {
            setIsWorkerReady(true);
            setWorkerError(null);
          } else {
            console.warn("MediaPipe worker initialization warning:", msg.error);
            setIsWorkerReady(false);
            setWorkerError(msg.error || "Failed to initialize face landmarker worker");
          }
        } else if (msg.type === "FRAME_RESULT") {
          isProcessingFrameRef.current = false;
          const frameData: FrameResultData = msg.data;

          setLiveMetrics(frameData.behavior);
          setLiveExpressions(frameData.expressions);
          setFaceStatus(frameData.expressions.visibilityStatus);

          // If active answer tracking, store in local memory buffer
          if (isTrackingAnswerRef.current) {
            answerBufferRef.current.push({
              metrics: frameData.behavior,
              expressions: frameData.expressions,
              timestamp: frameData.timestamp,
            });
          }
        } else if (msg.type === "ERROR") {
          isProcessingFrameRef.current = false;
          console.debug("Worker error tick:", msg.error);
        }
      };

      workerInstance.onerror = (err) => {
        console.error("Worker error:", err);
        setWorkerError("Worker error encountered");
        isProcessingFrameRef.current = false;
      };

      // Send INIT
      workerInstance.postMessage({ type: "INIT", targetFps: analysisFps });
    } catch (err: any) {
      console.error("Failed to spawn behavior analysis Web Worker:", err);
      setWorkerError("Web Worker support unavailable");
    }

    return () => {
      if (workerInstance) {
        workerInstance.postMessage({ type: "STOP" });
        workerInstance.terminate();
      }
      workerRef.current = null;
      setIsWorkerReady(false);
    };
  }, [analysisFps]);

  // 2. Continuous 5 FPS Frame Sampling Loop from existing Video element
  useEffect(() => {
    if (!cameraActive || !isWorkerReady) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLiveMetrics(DEFAULT_METRICS);
      setLiveExpressions(DEFAULT_EXPRESSIONS);
      setFaceStatus("missing");
      return;
    }

    const intervalMs = Math.max(50, Math.floor(1000 / analysisFps));

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const worker = workerRef.current;

      if (
        !video ||
        !worker ||
        !cameraActive ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0 ||
        isProcessingFrameRef.current
      ) {
        return;
      }

      try {
        isProcessingFrameRef.current = true;
        // Zero-copy transfer of video frame via ImageBitmap
        const imageBitmap = await createImageBitmap(video);
        const timestamp = Date.now();

        worker.postMessage(
          {
            type: "PROCESS_FRAME",
            imageBitmap,
            timestamp,
          },
          [imageBitmap]
        );
      } catch (err) {
        isProcessingFrameRef.current = false;
        console.debug("Frame capture error:", err);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive, isWorkerReady, analysisFps, videoRef]);

  // 3. Start Local Answer Buffer Tracking
  const startAnswerTracking = useCallback((questionId: string) => {
    isTrackingAnswerRef.current = true;
    currentQuestionIdRef.current = questionId;
    answerStartTimeRef.current = Date.now();
    answerBufferRef.current = [];
  }, []);

  // 4. Stop Local Answer Buffer & Compute Summary Analytics
  const stopAnswerTracking = useCallback((): AnswerAnalyticsSummary | null => {
    isTrackingAnswerRef.current = false;
    const questionId = currentQuestionIdRef.current || "unknown";
    const duration = Math.max(1, Math.round((Date.now() - answerStartTimeRef.current) / 1000));

    const buffer = answerBufferRef.current;
    if (!buffer || buffer.length === 0) {
      // Return neutral baseline if no frames recorded
      return {
        questionId,
        duration,
        smile: liveMetrics.smilePercentage || 0,
        confidence: liveMetrics.confidence || 75,
        attention: liveMetrics.attention || 80,
        eyeContact: liveMetrics.eyeContact || 80,
        nervousness: liveMetrics.nervousness || 20,
        confusion: liveMetrics.confusion || 10,
        blinkRate: liveExpressions.blinkRatePerMin || 15,
        headMovement: 100 - (liveMetrics.faceStability || 80),
        faceVisibility: faceStatus === "visible" ? 100 : 50,
      };
    }

    // Tally averages across all sampled frames during this answer
    let totalSmile = 0;
    let totalConfidence = 0;
    let totalAttention = 0;
    let totalEyeContact = 0;
    let totalNervousness = 0;
    let totalConfusion = 0;
    let totalStability = 0;
    let maxBlinkRate = 0;
    let visibleCount = 0;

    const count = buffer.length;
    buffer.forEach((item) => {
      totalSmile += item.metrics.smilePercentage;
      totalConfidence += item.metrics.confidence;
      totalAttention += item.metrics.attention;
      totalEyeContact += item.metrics.eyeContact;
      totalNervousness += item.metrics.nervousness;
      totalConfusion += item.metrics.confusion;
      totalStability += item.metrics.faceStability;
      if (item.expressions.blinkRatePerMin > maxBlinkRate) {
        maxBlinkRate = item.expressions.blinkRatePerMin;
      }
      if (item.expressions.visibilityStatus === "visible") {
        visibleCount++;
      }
    });

    const summary: AnswerAnalyticsSummary = {
      questionId,
      duration,
      smile: Math.round(totalSmile / count),
      confidence: Math.round(totalConfidence / count),
      attention: Math.round(totalAttention / count),
      eyeContact: Math.round(totalEyeContact / count),
      nervousness: Math.round(totalNervousness / count),
      confusion: Math.round(totalConfusion / count),
      blinkRate: maxBlinkRate,
      headMovement: Math.round(100 - (totalStability / count)),
      faceVisibility: Math.round((visibleCount / count) * 100),
    };

    // Clear local buffer for next question
    answerBufferRef.current = [];
    currentQuestionIdRef.current = null;

    return summary;
  }, [liveMetrics, liveExpressions, faceStatus]);

  return {
    isWorkerReady,
    workerError,
    liveMetrics,
    liveExpressions,
    faceStatus,
    startAnswerTracking,
    stopAnswerTracking,
  };
}
