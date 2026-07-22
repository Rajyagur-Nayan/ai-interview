"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBehaviorAnalysis } from "@/features/emotion";
import { AnswerAnalyticsSummary } from "@/features/emotion";

export interface ComposureLogItem {
  timestamp: string;
  emotion: string;
  confidence: number;
}

export function useEmotionDetection(cameraActive: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [emotionLog, setEmotionLog] = useState<ComposureLogItem[]>([]);

  // Integrated Behavior Analysis Engine
  const {
    isWorkerReady,
    workerError,
    liveMetrics,
    liveExpressions,
    faceStatus,
    startAnswerTracking,
    stopAnswerTracking,
  } = useBehaviorAnalysis({
    cameraActive,
    videoRef,
    analysisFps: 5,
  });

  // Manage Video Stream (Reuse existing camera stream)
  useEffect(() => {
    let isMounted = true;
    let localStream: MediaStream | null = null;

    async function startVideo() {
      if (!cameraActive) {
        stopVideo();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 400, height: 300, facingMode: "user" },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStream = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        if (isMounted) {
          console.error("Camera access failed:", error);
        }
      }
    }

    startVideo();

    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      stopVideo();
    };
  }, [cameraActive]);

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Derive active expression text for backward compatibility
  const detectedEmotion = liveExpressions.isSmiling
    ? "Focused / Smiling"
    : faceStatus === "missing"
    ? "Face Missing"
    : liveMetrics.confidence > 70
    ? "Confident / Focused"
    : "Neutral / Focused";

  // Interval logging (samples live snapshot every 5 seconds for telemetry UI)
  useEffect(() => {
    if (!cameraActive) return;

    const interval = setInterval(() => {
      setEmotionLog((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          emotion: detectedEmotion,
          confidence: Number((liveMetrics.confidence / 100).toFixed(2)),
        },
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, [cameraActive, detectedEmotion, liveMetrics.confidence]);

  const resetLog = useCallback(() => {
    setEmotionLog([]);
  }, []);

  const getEmotionSummary = useCallback(() => {
    if (emotionLog.length === 0) {
      return { "Focused / Composed": 100 };
    }
    const counts: Record<string, number> = {};
    emotionLog.forEach((item) => {
      counts[item.emotion] = (counts[item.emotion] || 0) + 1;
    });

    const summary: Record<string, number> = {};
    const total = emotionLog.length;
    Object.keys(counts).forEach((key) => {
      summary[key] = Math.round((counts[key] / total) * 100);
    });
    return summary;
  }, [emotionLog]);

  return {
    videoRef,
    detectedEmotion,
    emotionLog,
    resetLog,
    getEmotionSummary,
    modelsLoaded: isWorkerReady,
    workerError,
    liveMetrics,
    liveExpressions,
    faceStatus,
    startAnswerTracking,
    stopAnswerTracking,
  };
}
