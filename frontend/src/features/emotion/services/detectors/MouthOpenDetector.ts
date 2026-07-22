import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export interface MouthOpenResult {
  isOpen: boolean;
  mar: number;
}

export class MouthOpenDetector implements IExpressionDetector<MouthOpenResult> {
  detect(features: FacialFeatures): MouthOpenResult {
    return {
      isOpen: features.mouth.isOpen,
      mar: features.mouth.mar,
    };
  }
}
