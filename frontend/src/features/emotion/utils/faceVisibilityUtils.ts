import { Point3D } from "../types/landmarks";
import { FaceVisibilityMetric } from "../types/features";

export function extractFaceVisibility(
  landmarks: Point3D[] | undefined,
  faceCount: number = 0
): FaceVisibilityMetric {
  if (!landmarks || landmarks.length === 0 || faceCount === 0) {
    return {
      isVisible: false,
      isMissing: true,
      isOccluded: false,
      isOutOfFrame: false,
      occludedPercent: 0,
      outOfFramePercent: 100,
      faceCount: 0,
    };
  }

  // Count how many landmarks fall near edges (x/y in [0, 1] normalized space)
  let nearEdgeCount = 0;
  let missingLandmarkCount = 0;
  const totalLandmarks = landmarks.length;

  for (let i = 0; i < totalLandmarks; i++) {
    const pt = landmarks[i];
    if (pt.x < 0.05 || pt.x > 0.95 || pt.y < 0.05 || pt.y > 0.95) {
      nearEdgeCount++;
    }
    if (pt.visibility !== undefined && pt.visibility < 0.5) {
      missingLandmarkCount++;
    }
  }

  const outOfFramePercent = Math.min(100, Math.round((nearEdgeCount / totalLandmarks) * 100));
  const occludedPercent = Math.min(100, Math.round((missingLandmarkCount / totalLandmarks) * 100));

  const isOutOfFrame = outOfFramePercent > 40;
  const isOccluded = occludedPercent > 40;
  const isVisible = !isOutOfFrame && !isOccluded;

  return {
    isVisible,
    isMissing: false,
    isOccluded,
    isOutOfFrame,
    occludedPercent,
    outOfFramePercent,
    faceCount,
  };
}
