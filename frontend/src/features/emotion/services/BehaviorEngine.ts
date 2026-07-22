import { FacialFeatures } from "../types/features";
import { ExpressionResult } from "../types/expressions";
import { InterviewBehaviorMetrics } from "../types/behavior";
import { clamp } from "../utils/landmarkUtils";

// Configurable weights for behavioral metrics
export const BEHAVIOR_WEIGHTS = {
  CONFIDENCE: {
    EYE_CONTACT: 0.30,
    HEAD_STABILITY: 0.25,
    NATURAL_SMILE: 0.20,
    RELAXED_MOVEMENT: 0.15,
    VISIBILITY: 0.10,
  },
  NERVOUSNESS: {
    EXCESSIVE_BLINKING: 0.30,
    LOOKING_AWAY: 0.25,
    HEAD_JITTER: 0.20,
    LIP_COMPRESSION: 0.15,
    INSTABILITY: 0.10,
  },
  CONFUSION: {
    HEAD_TILT: 0.30,
    EYEBROW_RAISE_FROWN: 0.30,
    LOOKING_UP_AWAY: 0.20,
    FACIAL_INACTIVITY: 0.20,
  },
  ATTENTION: {
    EYE_CONTACT: 0.50,
    HEAD_CENTERING: 0.30,
    VISIBILITY: 0.20,
  },
  ENGAGEMENT: {
    EXPRESSIVENESS: 0.40,
    SMILE: 0.30,
    EYE_CONTACT: 0.30,
  },
};

export class BehaviorEngine {
  private lastHeadPose = { pitch: 0, yaw: 0, roll: 0 };
  private headMovementHistory: number[] = [];

  calculateMetrics(
    features: FacialFeatures,
    expressions: ExpressionResult
  ): InterviewBehaviorMetrics {
    if (expressions.visibilityStatus === "missing") {
      return {
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
    }

    // 1. Head Movement / Instability Delta
    const deltaPitch = Math.abs(features.headPose.pitch - this.lastHeadPose.pitch);
    const deltaYaw = Math.abs(features.headPose.yaw - this.lastHeadPose.yaw);
    const deltaRoll = Math.abs(features.headPose.roll - this.lastHeadPose.roll);
    const totalDelta = deltaPitch + deltaYaw + deltaRoll;
    
    this.lastHeadPose = {
      pitch: features.headPose.pitch,
      yaw: features.headPose.yaw,
      roll: features.headPose.roll,
    };

    this.headMovementHistory.push(totalDelta);
    if (this.headMovementHistory.length > 30) {
      this.headMovementHistory.shift();
    }

    const avgHeadJitter = this.headMovementHistory.reduce((a, b) => a + b, 0) / this.headMovementHistory.length;
    const faceStabilityScore = clamp(100 - avgHeadJitter * 8, 0, 100);

    // 2. Eye Contact Score
    const eyeContactScore = expressions.isEyeContact ? 100 : 20;

    // 3. Smile Score
    const smileScore = Math.round(expressions.smileScore * 100);

    // 4. Attention Score
    const headCentering = clamp(100 - (Math.abs(features.headPose.yaw) + Math.abs(features.headPose.pitch)) * 2, 0, 100);
    const visibilityScore = features.visibility.isVisible ? 100 : 50;

    const attentionScore = clamp(
      eyeContactScore * BEHAVIOR_WEIGHTS.ATTENTION.EYE_CONTACT +
      headCentering * BEHAVIOR_WEIGHTS.ATTENTION.HEAD_CENTERING +
      visibilityScore * BEHAVIOR_WEIGHTS.ATTENTION.VISIBILITY,
      0,
      100
    );

    // 5. Engagement Score
    const expressiveness = clamp((smileScore * 0.6) + (features.mouth.mar > 0.1 ? 30 : 0), 0, 100);
    const engagementScore = clamp(
      expressiveness * BEHAVIOR_WEIGHTS.ENGAGEMENT.EXPRESSIVENESS +
      smileScore * BEHAVIOR_WEIGHTS.ENGAGEMENT.SMILE +
      eyeContactScore * BEHAVIOR_WEIGHTS.ENGAGEMENT.EYE_CONTACT,
      0,
      100
    );

    // 6. Confidence Score
    const relaxedMovement = clamp(100 - avgHeadJitter * 5, 0, 100);
    const confidenceScore = clamp(
      eyeContactScore * BEHAVIOR_WEIGHTS.CONFIDENCE.EYE_CONTACT +
      faceStabilityScore * BEHAVIOR_WEIGHTS.CONFIDENCE.HEAD_STABILITY +
      smileScore * BEHAVIOR_WEIGHTS.CONFIDENCE.NATURAL_SMILE +
      relaxedMovement * BEHAVIOR_WEIGHTS.CONFIDENCE.RELAXED_MOVEMENT +
      visibilityScore * BEHAVIOR_WEIGHTS.CONFIDENCE.VISIBILITY,
      0,
      100
    );

    // 7. Nervousness Score (Heuristic)
    // Elevated blink rate > 25/min or rapid head jitter contributes to nervousness
    const blinkNervousness = expressions.blinkRatePerMin > 25 ? Math.min(100, (expressions.blinkRatePerMin - 25) * 4) : 0;
    const lookingAwayPenalty = expressions.isEyeContact ? 0 : 70;
    const lipCompression = (!features.mouth.isOpen && features.mouth.mar < 0.05) ? 60 : 10;
    const instabilityPenalty = 100 - faceStabilityScore;

    const nervousnessScore = clamp(
      blinkNervousness * BEHAVIOR_WEIGHTS.NERVOUSNESS.EXCESSIVE_BLINKING +
      lookingAwayPenalty * BEHAVIOR_WEIGHTS.NERVOUSNESS.LOOKING_AWAY +
      (avgHeadJitter * 10) * BEHAVIOR_WEIGHTS.NERVOUSNESS.HEAD_JITTER +
      lipCompression * BEHAVIOR_WEIGHTS.NERVOUSNESS.LIP_COMPRESSION +
      instabilityPenalty * BEHAVIOR_WEIGHTS.NERVOUSNESS.INSTABILITY,
      0,
      100
    );

    // 8. Confusion Score (Heuristic)
    const headTiltScore = Math.abs(features.headPose.roll) > 12 ? Math.min(100, Math.abs(features.headPose.roll) * 4) : 0;
    const eyebrowFrownScore = (expressions.isEyebrowRaised || expressions.isFrowning) ? 80 : 0;
    const lookingUpAway = (expressions.gazeDirection === "up" || expressions.gazeDirection === "left" || expressions.gazeDirection === "right") ? 70 : 0;
    const facialInactivity = (avgHeadJitter < 0.2 && !expressions.isSmiling && !features.mouth.isOpen) ? 50 : 0;

    const confusionScore = clamp(
      headTiltScore * BEHAVIOR_WEIGHTS.CONFUSION.HEAD_TILT +
      eyebrowFrownScore * BEHAVIOR_WEIGHTS.CONFUSION.EYEBROW_RAISE_FROWN +
      lookingUpAway * BEHAVIOR_WEIGHTS.CONFUSION.LOOKING_UP_AWAY +
      facialInactivity * BEHAVIOR_WEIGHTS.CONFUSION.FACIAL_INACTIVITY,
      0,
      100
    );

    // 9. Focus Score
    const focusScore = clamp((attentionScore * 0.6) + (faceStabilityScore * 0.4), 0, 100);

    return {
      confidence: Math.round(confidenceScore),
      attention: Math.round(attentionScore),
      engagement: Math.round(engagementScore),
      nervousness: Math.round(nervousnessScore),
      confusion: Math.round(confusionScore),
      eyeContact: Math.round(eyeContactScore),
      focus: Math.round(focusScore),
      faceStability: Math.round(faceStabilityScore),
      smilePercentage: smileScore,
    };
  }

  reset(): void {
    this.lastHeadPose = { pitch: 0, yaw: 0, roll: 0 };
    this.headMovementHistory = [];
  }
}
