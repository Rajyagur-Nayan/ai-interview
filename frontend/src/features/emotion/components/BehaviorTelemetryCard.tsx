"use client";

import React from "react";
import { InterviewBehaviorMetrics } from "../types/behavior";
import { ExpressionResult } from "../types/expressions";
import { BehaviorAnalyticsOverlay } from "./BehaviorAnalyticsOverlay";

interface BehaviorTelemetryCardProps {
  metrics: InterviewBehaviorMetrics;
  expressions: ExpressionResult;
  faceStatus: "visible" | "missing" | "occluded" | "out_of_frame";
  isWorkerReady: boolean;
  workerError: string | null;
}

export function BehaviorTelemetryCard(props: BehaviorTelemetryCardProps) {
  return <BehaviorAnalyticsOverlay {...props} />;
}

export default BehaviorTelemetryCard;
