import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export class FrownDetector implements IExpressionDetector<boolean> {
  detect(features: FacialFeatures): boolean {
    return features.eyebrows.isFrowning;
  }
}
