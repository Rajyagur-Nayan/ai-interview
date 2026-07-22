import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export class FaceVisibilityDetector implements IExpressionDetector<"visible" | "missing" | "occluded" | "out_of_frame"> {
  detect(features: FacialFeatures): "visible" | "missing" | "occluded" | "out_of_frame" {
    if (features.visibility.isMissing) return "missing";
    if (features.visibility.isOutOfFrame) return "out_of_frame";
    if (features.visibility.isOccluded) return "occluded";
    return "visible";
  }
}
