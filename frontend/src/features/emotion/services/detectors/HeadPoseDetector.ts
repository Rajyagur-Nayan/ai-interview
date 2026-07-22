import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export interface HeadPoseDetectorResult {
  pitch: number;
  yaw: number;
  roll: number;
  isStable: boolean;
}

export class HeadPoseDetector implements IExpressionDetector<HeadPoseDetectorResult> {
  detect(features: FacialFeatures): HeadPoseDetectorResult {
    return {
      pitch: features.headPose.pitch,
      yaw: features.headPose.yaw,
      roll: features.headPose.roll,
      isStable: features.headPose.isStable,
    };
  }
}
