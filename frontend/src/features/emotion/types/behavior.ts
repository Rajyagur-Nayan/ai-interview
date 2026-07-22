export interface InterviewBehaviorMetrics {
  confidence: number;    // 0 - 100
  attention: number;     // 0 - 100
  engagement: number;    // 0 - 100
  nervousness: number;   // 0 - 100 (heuristic)
  confusion: number;     // 0 - 100 (heuristic)
  eyeContact: number;    // 0 - 100
  focus: number;         // 0 - 100
  faceStability: number; // 0 - 100
  smilePercentage: number; // 0 - 100
}
