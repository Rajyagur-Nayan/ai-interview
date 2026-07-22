import { FacialFeatures } from "../../types/features";

export interface IExpressionDetector<T> {
  detect(features: FacialFeatures, timestamp?: number): T;
  reset?(): void;
}
