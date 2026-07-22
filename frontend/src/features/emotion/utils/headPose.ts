import { Point3D } from "../types/landmarks";
import { HeadRotationMetric } from "../types/features";
import { distance2D } from "./landmarkUtils";

const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

export function extractHeadRotation(
  landmarks: Point3D[],
  transformationMatrix?: number[][]
): HeadRotationMetric {
  if (transformationMatrix && transformationMatrix.length >= 4) {
    // If MediaPipe provides the transformation matrix, extract Euler angles
    // Matrix format: 4x4 matrix
    const r00 = transformationMatrix[0][0];
    const r10 = transformationMatrix[1][0];
    const r20 = transformationMatrix[2][0];
    const r21 = transformationMatrix[2][1];
    const r22 = transformationMatrix[2][2];

    const pitch = Math.atan2(r21, r22) * (180 / Math.PI);
    const yaw = Math.atan2(-r20, Math.sqrt(r21 * r21 + r22 * r22)) * (180 / Math.PI);
    const roll = Math.atan2(r10, r00) * (180 / Math.PI);

    const isStable = Math.abs(yaw) < 12 && Math.abs(pitch) < 12 && Math.abs(roll) < 10;
    return { pitch, yaw, roll, isStable };
  }

  if (!landmarks || landmarks.length < 300) {
    return { pitch: 0, yaw: 0, roll: 0, isStable: true };
  }

  const nose = landmarks[NOSE_TIP];
  const chin = landmarks[CHIN];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];

  // 1. Roll: Angle of the eye line relative to horizontal
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const roll = Math.atan2(dy, dx) * (180 / Math.PI);

  // 2. Yaw: Nose tip displacement relative to eye center
  const eyeCenter: Point3D = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2, z: ((leftEye.z || 0) + (rightEye.z || 0)) / 2 };
  const eyeWidth = distance2D(leftEye, rightEye);

  const noseDx = nose.x - eyeCenter.x;
  const yawRatio = eyeWidth > 0 ? noseDx / eyeWidth : 0;
  const yaw = yawRatio * 90; // Approx degrees (-90 to +90)

  // 3. Pitch: Vertical distance ratio nose to eye center vs nose to chin
  const distEyeToNose = distance2D(eyeCenter, nose);
  const distNoseToChin = distance2D(nose, chin);
  const verticalRatio = distNoseToChin > 0 ? distEyeToNose / distNoseToChin : 0.8;
  const pitch = (verticalRatio - 0.7) * 100; // Approx degrees

  const isStable = Math.abs(yaw) < 12 && Math.abs(pitch) < 12 && Math.abs(roll) < 10;

  return {
    pitch,
    yaw,
    roll,
    isStable,
  };
}
