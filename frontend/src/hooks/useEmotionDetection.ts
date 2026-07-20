"use client";

import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export interface ComposureLogItem {
  timestamp: string;
  emotion: string;
  confidence: number;
}

export function useEmotionDetection(cameraActive: boolean) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoadedSuccessfully, setModelsLoadedSuccessfully] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string>("Initializing...");
  const [emotionLog, setEmotionLog] = useState<ComposureLogItem[]>([]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const emotionBufferRef = useRef<{ emotion: string; confidence: number }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load face-api models
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setModelsLoadedSuccessfully(true);
        setDetectedEmotion("Neutral");
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        // Fallback gracefully so the candidate is not blocked
        setModelsLoaded(true);
        setModelsLoadedSuccessfully(false);
        setDetectedEmotion("Focused");
      }
    }
    loadModels();
  }, []);

  // 2. Manage Video Stream
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

    if (modelsLoaded) {
      startVideo();
    }

    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      stopVideo();
    };
  }, [modelsLoaded, cameraActive]);

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 3. Classification loop (every 1 second) and logging buffer
  useEffect(() => {
    let detectInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    if (modelsLoaded && modelsLoadedSuccessfully && cameraActive) {
      detectInterval = setInterval(async () => {
        const video = videoRef.current;
        if (
          video &&
          cameraActive &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          try {
            const detections = await faceapi
              .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceExpressions();

            if (detections && isMounted) {
              const expressions: any = detections.expressions;
              let maxExpr = "neutral";
              let maxVal = 0;

              // Filter out Happy, Sad, Neutral, Angry, Fearful, Surprised
              const supportedEmotions = ["happy", "sad", "neutral", "angry", "fearful", "surprised"];
              Object.keys(expressions).forEach((key) => {
                if (supportedEmotions.includes(key) && expressions[key] > maxVal) {
                  maxVal = expressions[key];
                  maxExpr = key;
                }
              });

              const capitalized = maxExpr.charAt(0).toUpperCase() + maxExpr.slice(1);
              setDetectedEmotion(capitalized);

              // Add to buffer
              emotionBufferRef.current.push({ emotion: capitalized, confidence: maxVal });
            }
          } catch (e) {
            console.debug("Face detection tick error:", e);
          }
        }
      }, 1000);
    }

    return () => {
      isMounted = false;
      if (detectInterval) clearInterval(detectInterval);
    };
  }, [modelsLoaded, cameraActive]);

  // 4. Samples the dominant emotion from the buffer precisely every 5 seconds
  useEffect(() => {
    if (modelsLoaded && cameraActive) {
      intervalRef.current = setInterval(() => {
        const buffer = emotionBufferRef.current;
        if (buffer.length === 0) {
          // If no detections, log a neutral snapshot
          setEmotionLog((prev) => [
            ...prev,
            { timestamp: new Date().toISOString(), emotion: "Neutral", confidence: 1.0 },
          ]);
          return;
        }

        // Tally emotion frequencies
        const counts: Record<string, { count: number; totalConf: number }> = {};
        buffer.forEach((item) => {
          if (!counts[item.emotion]) {
            counts[item.emotion] = { count: 0, totalConf: 0 };
          }
          counts[item.emotion].count += 1;
          counts[item.emotion].totalConf += item.confidence;
        });

        // Determine dominant emotion
        let dominantEmotion = "Neutral";
        let maxCount = 0;
        let dominantConfidence = 1.0;

        Object.keys(counts).forEach((emotion) => {
          if (counts[emotion].count > maxCount) {
            maxCount = counts[emotion].count;
            dominantEmotion = emotion;
            dominantConfidence = counts[emotion].totalConf / counts[emotion].count;
          }
        });

        // Log dominant emotion
        setEmotionLog((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            emotion: dominantEmotion,
            confidence: Number(dominantConfidence.toFixed(2)),
          },
        ]);

        // Clear buffer
        emotionBufferRef.current = [];
      }, 5000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [modelsLoaded, cameraActive]);

  // Clean log callback
  const resetLog = () => {
    setEmotionLog([]);
    emotionBufferRef.current = [];
  };

  // Generate Summary Metrics
  const getEmotionSummary = () => {
    const summary: Record<string, number> = {};
    if (emotionLog.length === 0) return summary;

    emotionLog.forEach((item) => {
      summary[item.emotion] = (summary[item.emotion] || 0) + 1;
    });

    // Convert counts to percentages
    const total = emotionLog.length;
    Object.keys(summary).forEach((key) => {
      summary[key] = Math.round((summary[key] / total) * 100);
    });

    return summary;
  };

  return {
    videoRef,
    detectedEmotion,
    emotionLog,
    resetLog,
    getEmotionSummary,
    modelsLoaded,
  };
}
