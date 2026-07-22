import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export interface SmileDetectorResult {
  smileScore: number; // 0 - 1
  isSmiling: boolean;
}

export class SmileDetector implements IExpressionDetector<SmileDetectorResult> {
  detect(features: FacialFeatures): SmileDetectorResult {
    const smileScore = features.mouth.smileRatio;
    return {
      smileScore,
      isSmiling: features.mouth.isSmiling,
    };
  }
}
