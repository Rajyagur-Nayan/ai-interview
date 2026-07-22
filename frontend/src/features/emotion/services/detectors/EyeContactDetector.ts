import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export interface EyeContactResult {
  isEyeContact: boolean;
  direction: "center" | "left" | "right" | "up" | "down";
}

export class EyeContactDetector implements IExpressionDetector<EyeContactResult> {
  detect(features: FacialFeatures): EyeContactResult {
    return {
      isEyeContact: features.gaze.isEyeContact,
      direction: features.gaze.direction,
    };
  }
}
