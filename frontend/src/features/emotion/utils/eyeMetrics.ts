import { Point3D } from "../types/landmarks";
import { EyeOpeningMetric, EyeBlinkMetric, EyeGazeMetric } from "../types/features";
import { distance2D } from "./landmarkUtils";

// MediaPipe 468 landmark indices for left and right eyes
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const LEFT_EYE_TOP1 = 159;
const LEFT_EYE_BOTTOM1 = 145;
const LEFT_EYE_TOP2 = 158;
const LEFT_EYE_BOTTOM2 = 144;

const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_TOP1 = 386;
const RIGHT_EYE_BOTTOM1 = 374;
const RIGHT_EYE_TOP2 = 385;
const RIGHT_EYE_BOTTOM2 = 373;

// Iris landmarks (468, 473)
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;

export function calculateEAR(
  pOuter: Point3D,
  pInner: Point3D,
  pTop1: Point3D,
  pBottom1: Point3D,
  pTop2: Point3D,
  pBottom2: Point3D
): number {
  const v1 = distance2D(pTop1, pBottom1);
  const v2 = distance2D(pTop2, pBottom2);
  const h = distance2D(pOuter, pInner);
  if (h === 0) return 0;
  return (v1 + v2) / (2.0 * h);
}

export function extractEyeOpening(landmarks: Point3D[]): EyeOpeningMetric {
  if (!landmarks || landmarks.length < 400) {
    return { leftEAR: 0, rightEAR: 0, averageEAR: 0 };
  }

  const leftEAR = calculateEAR(
    landmarks[LEFT_EYE_OUTER],
    landmarks[LEFT_EYE_INNER],
    landmarks[LEFT_EYE_TOP1],
    landmarks[LEFT_EYE_BOTTOM1],
    landmarks[LEFT_EYE_TOP2],
    landmarks[LEFT_EYE_BOTTOM2]
  );

  const rightEAR = calculateEAR(
    landmarks[RIGHT_EYE_OUTER],
    landmarks[RIGHT_EYE_INNER],
    landmarks[RIGHT_EYE_TOP1],
    landmarks[RIGHT_EYE_BOTTOM1],
    landmarks[RIGHT_EYE_TOP2],
    landmarks[RIGHT_EYE_BOTTOM2]
  );

  const averageEAR = (leftEAR + rightEAR) / 2.0;

  return { leftEAR, rightEAR, averageEAR };
}

export function extractBlinkState(
  eyeOpening: EyeOpeningMetric,
  blendshapeBlinkLeft?: number,
  blendshapeBlinkRight?: number,
  blinkThreshold = 0.19
): EyeBlinkMetric {
  let leftBlink = eyeOpening.leftEAR < blinkThreshold;
  let rightBlink = eyeOpening.rightEAR < blinkThreshold;

  if (blendshapeBlinkLeft !== undefined && blendshapeBlinkLeft > 0.4) {
    leftBlink = true;
  }
  if (blendshapeBlinkRight !== undefined && blendshapeBlinkRight > 0.4) {
    rightBlink = true;
  }

  return {
    leftBlink,
    rightBlink,
    isBlinking: leftBlink || rightBlink,
  };
}

export function extractEyeGaze(
  landmarks: Point3D[],
  headYaw: number,
  headPitch: number
): EyeGazeMetric {
  if (!landmarks || landmarks.length < 474) {
    // Fallback based on head pose
    const isCenter = Math.abs(headYaw) < 15 && Math.abs(headPitch) < 15;
    return {
      x: headYaw / 30,
      y: headPitch / 30,
      isEyeContact: isCenter,
      direction: isCenter ? "center" : headYaw > 15 ? "right" : headYaw < -15 ? "left" : headPitch > 15 ? "down" : "up",
    };
  }

  const leftIris = landmarks[LEFT_IRIS];
  const rightIris = landmarks[RIGHT_IRIS];
  const leftOuter = landmarks[LEFT_EYE_OUTER];
  const leftInner = landmarks[LEFT_EYE_INNER];
  const rightOuter = landmarks[RIGHT_EYE_OUTER];
  const rightInner = landmarks[RIGHT_EYE_INNER];

  // Relative X positions of iris within eye width
  const leftWidth = distance2D(leftOuter, leftInner);
  const rightWidth = distance2D(rightOuter, rightInner);

  const leftDistOuter = distance2D(leftIris, leftOuter);
  const rightDistInner = distance2D(rightIris, rightInner);

  const leftRatio = leftWidth > 0 ? leftDistOuter / leftWidth : 0.5;
  const rightRatio = rightWidth > 0 ? rightDistInner / rightWidth : 0.5;

  const avgRatioX = (leftRatio + rightRatio) / 2.0;

  // Normalized X from -1 (left) to 1 (right)
  const gazeX = (avgRatioX - 0.5) * 2.0;
  const gazeY = headPitch / 30; // normalized vertical gaze estimation

  const isEyeContact = Math.abs(gazeX) < 0.35 && Math.abs(headYaw) < 15 && Math.abs(headPitch) < 15;

  let direction: "center" | "left" | "right" | "up" | "down" = "center";
  if (!isEyeContact) {
    if (gazeX < -0.35 || headYaw < -15) direction = "left";
    else if (gazeX > 0.35 || headYaw > 15) direction = "right";
    else if (headPitch < -15) direction = "up";
    else if (headPitch > 15) direction = "down";
  }

  return {
    x: gazeX,
    y: gazeY,
    isEyeContact,
    direction,
  };
}
