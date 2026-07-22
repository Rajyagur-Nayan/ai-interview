"use client";

import React from "react";
import { InterviewBehaviorMetrics } from "../types/behavior";
import { ExpressionResult } from "../types/expressions";
import { Smile, Eye, Target, Camera, Sparkles, Activity, ShieldAlert, AlertTriangle } from "lucide-react";

interface BehaviorAnalyticsOverlayProps {
  metrics: InterviewBehaviorMetrics;
  expressions: ExpressionResult;
  faceStatus: "visible" | "missing" | "occluded" | "out_of_frame";
  isWorkerReady: boolean;
  workerError: string | null;
}

export function BehaviorAnalyticsOverlay({
  metrics,
  expressions,
  faceStatus,
  isWorkerReady,
  workerError,
}: BehaviorAnalyticsOverlayProps) {
  // Status indicator helpers
  const getVisibilityStatusBadge = () => {
    switch (faceStatus) {
      case "visible":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200/60 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Face Visible
          </span>
        );
      case "occluded":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200/60 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            Face Occluded
          </span>
        );
      case "out_of_frame":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200/60 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5" />
            Out of Frame
          </span>
        );
      case "missing":
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200/60 shadow-sm">
            <Camera className="w-3.5 h-3.5 text-red-500" />
            Face Missing
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-white border border-neutral-200/80 p-6 rounded-[28px] shadow-sm flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-green-500" />
            Interview Behavior Telemetry
          </div>
          <h3 className="text-lg font-extrabold text-neutral-900">Real-Time Biometrics</h3>
        </div>
        <div>
          {isWorkerReady ? (
            getVisibilityStatusBadge()
          ) : (
            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              {workerError ? "Fallback Mode" : "Initializing Engine..."}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Smile */}
        <div className="p-3.5 rounded-2xl bg-green-500/5 border border-green-500/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
            <span>🙂 Smile</span>
            <Smile className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-green-700">{metrics.smilePercentage}%</span>
            <span className="text-[10px] text-neutral-400 font-bold">
              {expressions.isSmiling ? "Smiling" : "Neutral"}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${metrics.smilePercentage}%` }}
            />
          </div>
        </div>

        {/* Eye Contact */}
        <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
            <span>👀 Eye Contact</span>
            <Eye className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-blue-700">{metrics.eyeContact}%</span>
            <span className="text-[10px] text-neutral-400 font-bold capitalize">
              {expressions.gazeDirection}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${metrics.eyeContact}%` }}
            />
          </div>
        </div>

        {/* Focus */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
            <span>🎯 Focus</span>
            <Target className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-700">{metrics.focus}%</span>
            <span className="text-[10px] text-neutral-400 font-bold">
              {metrics.focus > 70 ? "High" : "Moderate"}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${metrics.focus}%` }}
            />
          </div>
        </div>

        {/* Confidence */}
        <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
            <span>✨ Confidence</span>
            <Activity className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-700">{metrics.confidence}%</span>
            <span className="text-[10px] text-neutral-400 font-bold">
              {metrics.confidence > 75 ? "Poised" : "Calm"}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${metrics.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Behavioral Indicator Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <span className="font-semibold text-neutral-600">Facial Engagement</span>
          <span className="font-extrabold text-neutral-900">{metrics.engagement}%</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <span className="font-semibold text-neutral-600">Composure / Stability</span>
          <span className="font-extrabold text-neutral-900">{metrics.faceStability}%</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 col-span-2 sm:col-span-1">
          <span className="font-semibold text-neutral-600">Blink Rate</span>
          <span className="font-extrabold text-neutral-900">{expressions.blinkRatePerMin} / min</span>
        </div>
      </div>
    </div>
  );
}
