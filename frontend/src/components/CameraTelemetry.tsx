"use client";

import React from "react";
import { Video, VideoOff, Sparkles, Activity, ShieldAlert, Calendar } from "lucide-react";
import { ComposureLogItem } from "@/hooks/useEmotionDetection";
import { BehaviorAnalyticsOverlay } from "@/features/emotion";
import { InterviewBehaviorMetrics } from "@/features/emotion";
import { ExpressionResult } from "@/features/emotion";

interface CameraTelemetryProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  setCameraActive: (active: boolean) => void;
  detectedEmotion: string;
  emotionLog: ComposureLogItem[];
  modelsLoaded: boolean;
  getEmotionSummary: () => Record<string, number>;
  liveMetrics?: InterviewBehaviorMetrics;
  liveExpressions?: ExpressionResult;
  faceStatus?: "visible" | "missing" | "occluded" | "out_of_frame";
  workerError?: string | null;
}

export default function CameraTelemetry({
  videoRef,
  cameraActive,
  setCameraActive,
  detectedEmotion,
  emotionLog,
  modelsLoaded,
  getEmotionSummary,
  liveMetrics,
  liveExpressions,
  faceStatus = "visible",
  workerError = null,
}: CameraTelemetryProps) {
  const emotionSummary = getEmotionSummary();

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case "happy":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/20",
          text: "text-green-600",
          progress: "bg-green-500",
          glow: "shadow-green-500/10",
        };
      case "surprised":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          text: "text-amber-600",
          progress: "bg-amber-500",
          glow: "shadow-amber-500/10",
        };
      case "sad":
      case "fearful":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          text: "text-blue-600",
          progress: "bg-blue-500",
          glow: "shadow-blue-500/10",
        };
      case "angry":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          text: "text-red-600",
          progress: "bg-red-500",
          glow: "shadow-red-500/10",
        };
      case "neutral":
      case "focused":
      default:
        return {
          bg: "bg-green-500/5",
          border: "border-green-500/15",
          text: "text-green-600",
          progress: "bg-green-500",
          glow: "shadow-green-500/5",
        };
    }
  };

  const activeColor = getEmotionColor(detectedEmotion);

  return (
    <div className="flex flex-col space-y-6 w-full h-full text-neutral-900">
      {/* Webcam Feed Box */}
      <div className="bg-white border border-neutral-200/80 rounded-[32px] overflow-hidden relative aspect-video flex flex-col items-center justify-center shadow-lg group">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Soft status overlay pill */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-neutral-200/60 rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider text-neutral-600 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${modelsLoaded ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-ping"}`} />
              {modelsLoaded ? "MediaPipe Worker Active" : "Initializing Engine..."}
            </div>

            {/* Candidate Profile Avatar Bubble */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-neutral-200/60 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-bold text-neutral-700 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-green-500" />
              Candidate Live Feed
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2.5 text-neutral-400">
            <VideoOff className="w-12 h-12 stroke-[1.5]" />
            <span className="text-xs font-bold uppercase tracking-wider">Camera is deactivated</span>
          </div>
        )}

        {/* Toggle Cam Button */}
        <button
          onClick={() => setCameraActive(!cameraActive)}
          className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md hover:bg-white text-neutral-800 rounded-full w-10 h-10 transition-all cursor-pointer border border-neutral-200 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95"
          title={cameraActive ? "Deactivate Camera" : "Activate Camera"}
        >
          {cameraActive ? <VideoOff className="w-4.5 h-4.5 text-neutral-500" /> : <Video className="w-4.5 h-4.5 text-green-600" />}
        </button>
      </div>

      {/* Production-Ready Real-Time Behavior Overlay */}
      {liveMetrics && liveExpressions && (
        <BehaviorAnalyticsOverlay
          metrics={liveMetrics}
          expressions={liveExpressions}
          faceStatus={faceStatus}
          isWorkerReady={modelsLoaded}
          workerError={workerError}
        />
      )}

      {/* Composure Session Log Dashboard */}
      <div className="bg-white p-8 rounded-[32px] border border-neutral-200/80 flex-1 flex flex-col justify-between relative overflow-hidden shadow-lg">
        <div className={`absolute -right-24 -top-24 w-48 h-48 rounded-full filter blur-[60px] opacity-10 transition-all duration-1000 ${activeColor.progress}`} />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Interval Snapshot Feed
              </div>
              <h3 className="text-lg font-extrabold text-neutral-900">Session History</h3>
            </div>
            {modelsLoaded && cameraActive && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200/50">
                <Activity className="w-3 h-3 animate-pulse" />
                Active
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              Interval Telemetry Snapshots
            </h4>
            <div className="max-h-[140px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {emotionLog.length === 0 ? (
                <div className="text-xs text-neutral-400 italic">No telemetry logged yet. Start speaking to record.</div>
              ) : (
                [...emotionLog].reverse().slice(0, 5).map((log, index) => {
                  const colors = getEmotionColor(log.emotion);
                  const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <div key={index} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-[#F8FAF8] border border-neutral-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colors.progress}`} />
                        <span className="font-bold text-neutral-700">{log.emotion}</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-400 text-[10px] font-bold">
                        <span>Conf: {Math.round(log.confidence * 100)}%</span>
                        <span>{time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-neutral-400" />
          <span className="text-[10px] text-neutral-400 font-bold">
            All facial biometrics are computed 100% inside your browser via Web Worker. No video frames leave your device.
          </span>
        </div>
      </div>
    </div>
  );
}
