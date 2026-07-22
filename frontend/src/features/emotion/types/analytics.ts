export interface AnswerAnalyticsSummary {
  questionId: string;
  duration: number;        // Total duration of answer in seconds
  smile: number;           // Average smile % (0-100)
  confidence: number;      // Average confidence % (0-100)
  attention: number;       // Average attention % (0-100)
  eyeContact: number;      // Average eye contact % (0-100)
  nervousness: number;     // Average nervousness % (0-100)
  confusion: number;       // Average confusion % (0-100)
  blinkRate: number;       // Max or average blink rate per minute
  headMovement: number;    // Average head instability / movement (0-100)
  faceVisibility: number;  // Average face visibility % (0-100)
}
