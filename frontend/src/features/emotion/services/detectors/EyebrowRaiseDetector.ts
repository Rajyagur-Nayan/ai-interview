import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export class EyebrowRaiseDetector implements IExpressionDetector<boolean> {
  detect(features: FacialFeatures): boolean {
    return features.eyebrows.isRaised;
  }
}
