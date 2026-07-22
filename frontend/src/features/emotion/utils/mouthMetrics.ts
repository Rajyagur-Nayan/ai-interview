import { Point3D } from "../types/landmarks";
import { MouthMetric } from "../types/features";
import { distance2D } from "./landmarkUtils";

const MOUTHLIP_LEFT = 61;
const MOUTHLIP_RIGHT = 291;
const LIP_TOP_INNER = 13;
const LIP_BOTTOM_INNER = 14;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

export function extractMouthMetrics(
  landmarks: Point3D[],
  blendshapeSmileLeft?: number,
  blendshapeSmileRight?: number
): MouthMetric {
  if (!landmarks || landmarks.length < 300) {
    return { width: 0, height: 0, mar: 0, isOpen: false, smileRatio: 0, isSmiling: false };
  }

  const mouthLeft = landmarks[MOUTHLIP_LEFT];
  const mouthRight = landmarks[MOUTHLIP_RIGHT];
  const lipTop = landmarks[LIP_TOP_INNER];
  const lipBottom = landmarks[LIP_BOTTOM_INNER];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];

  const width = distance2D(mouthLeft, mouthRight);
  const height = distance2D(lipTop, lipBottom);
  const eyeDistance = distance2D(leftEye, rightEye);

  const mar = width > 0 ? height / width : 0;
  const isOpen = mar > 0.35;

  // Smile ratio: mouth width relative to inter-eye distance
  const smileRatio = eyeDistance > 0 ? width / eyeDistance : 0.5;
  
  // Base smile calculation (normal mouth ratio is ~0.45 - 0.52; smiling stretches it to > 0.55)
  let smileScore = Math.max(0, Math.min(1, (smileRatio - 0.48) / 0.22));

  // If MediaPipe blendshapes are available, combine blendshapes
  if (blendshapeSmileLeft !== undefined && blendshapeSmileRight !== undefined) {
    const blendshapeSmile = (blendshapeSmileLeft + blendshapeSmileRight) / 2.0;
    smileScore = (smileScore * 0.4) + (blendshapeSmile * 0.6);
  }

  return {
    width,
    height,
    mar,
    isOpen,
    smileRatio: Number(smileScore.toFixed(2)),
    isSmiling: smileScore > 0.45,
  };
}
