import { Point3D } from "../types/landmarks";
import { EyebrowMetric } from "../types/features";
import { distance2D } from "./landmarkUtils";

const LEFT_EYEBROW_INNER = 107;
const RIGHT_EYEBROW_INNER = 336;
const LEFT_EYEBROW_OUTER = 70;
const RIGHT_EYEBROW_OUTER = 300;
const LEFT_EYE_TOP = 159;
const RIGHT_EYE_TOP = 386;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

export function extractEyebrowMetrics(
  landmarks: Point3D[],
  blendshapeBrowDownLeft?: number,
  blendshapeBrowDownRight?: number,
  blendshapeBrowOuterUpLeft?: number,
  blendshapeBrowOuterUpRight?: number
): EyebrowMetric {
  if (!landmarks || landmarks.length < 340) {
    return { height: 0, isRaised: false, isFrowning: false };
  }

  const leftBrowInner = landmarks[LEFT_EYEBROW_INNER];
  const rightBrowInner = landmarks[RIGHT_EYEBROW_INNER];
  const leftEyeTop = landmarks[LEFT_EYE_TOP];
  const rightEyeTop = landmarks[RIGHT_EYE_TOP];
  const leftEyeOuter = landmarks[LEFT_EYE_OUTER];
  const rightEyeOuter = landmarks[RIGHT_EYE_OUTER];

  const eyeDist = distance2D(leftEyeOuter, rightEyeOuter);

  // Distance between inner eyebrows (frown contracts inner brows together)
  const innerBrowDist = distance2D(leftBrowInner, rightBrowInner);
  const innerBrowRatio = eyeDist > 0 ? innerBrowDist / eyeDist : 0.35;

  // Vertical height from eye top to eyebrow inner
  const leftHeight = distance2D(leftBrowInner, leftEyeTop);
  const rightHeight = distance2D(rightBrowInner, rightEyeTop);
  const avgHeight = (leftHeight + rightHeight) / 2.0;
  const heightRatio = eyeDist > 0 ? avgHeight / eyeDist : 0.2;

  let isRaised = heightRatio > 0.25;
  let isFrowning = innerBrowRatio < 0.24;

  if (blendshapeBrowDownLeft !== undefined && blendshapeBrowDownRight !== undefined) {
    const browDown = (blendshapeBrowDownLeft + blendshapeBrowDownRight) / 2.0;
    if (browDown > 0.4) isFrowning = true;
  }

  if (blendshapeBrowOuterUpLeft !== undefined && blendshapeBrowOuterUpRight !== undefined) {
    const browUp = (blendshapeBrowOuterUpLeft + blendshapeBrowOuterUpRight) / 2.0;
    if (browUp > 0.4) isRaised = true;
  }

  return {
    height: Number(heightRatio.toFixed(2)),
    isRaised,
    isFrowning,
  };
}
