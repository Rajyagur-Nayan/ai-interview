import { IExpressionDetector } from "./IExpressionDetector";
import { FacialFeatures } from "../../types/features";

export interface BlinkDetectorResult {
  isBlinking: boolean;
  blinkCount: number;
  blinkRatePerMin: number;
}

export class BlinkDetector implements IExpressionDetector<BlinkDetectorResult> {
  private wasBlinking: boolean = false;
  private blinkTimestamps: number[] = [];
  private totalBlinks: number = 0;

  detect(features: FacialFeatures, timestamp: number = Date.now()): BlinkDetectorResult {
    const isBlinking = features.blink.isBlinking;

    // Detect state transition from not blinking to blinking
    if (isBlinking && !this.wasBlinking) {
      this.totalBlinks++;
      this.blinkTimestamps.push(timestamp);
    }
    this.wasBlinking = isBlinking;

    // Filter out blink timestamps older than 60 seconds (60,000 ms)
    const cutoff = timestamp - 60000;
    this.blinkTimestamps = this.blinkTimestamps.filter((t) => t >= cutoff);

    // Calculate rate per minute based on active duration or rolling 60s window
    const windowDurationSec = this.blinkTimestamps.length > 0
      ? Math.max(5, (timestamp - (this.blinkTimestamps[0] || timestamp)) / 1000)
      : 60;
    
    const blinkRatePerMin = Math.round((this.blinkTimestamps.length / windowDurationSec) * 60);

    return {
      isBlinking,
      blinkCount: this.totalBlinks,
      blinkRatePerMin: Math.min(100, blinkRatePerMin),
    };
  }

  reset(): void {
    this.wasBlinking = false;
    this.blinkTimestamps = [];
    this.totalBlinks = 0;
  }
}
