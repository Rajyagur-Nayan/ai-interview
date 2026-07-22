import { Point3D, Classifications } from "../types/landmarks";
import { FacialFeatures } from "../types/features";
import { ExpressionResult } from "../types/expressions";
import { extractEyeOpening, extractBlinkState, extractEyeGaze } from "../utils/eyeMetrics";
import { extractHeadRotation } from "../utils/headPose";
import { extractMouthMetrics } from "../utils/mouthMetrics";
import { extractEyebrowMetrics } from "../utils/eyebrowMetrics";
import { extractFaceVisibility } from "../utils/faceVisibilityUtils";

import { SmileDetector } from "./detectors/SmileDetector";
import { BlinkDetector } from "./detectors/BlinkDetector";
import { MouthOpenDetector } from "./detectors/MouthOpenDetector";
import { EyeContactDetector } from "./detectors/EyeContactDetector";
import { HeadPoseDetector } from "./detectors/HeadPoseDetector";
import { EyebrowRaiseDetector } from "./detectors/EyebrowRaiseDetector";
import { FrownDetector } from "./detectors/FrownDetector";
import { FaceVisibilityDetector } from "./detectors/FaceVisibilityDetector";

export interface IExpressionEngine {
  extractFeatures(
    landmarks: Point3D[] | undefined,
    faceCount: number,
    blendshapes?: Classifications,
    transformationMatrix?: number[][]
  ): FacialFeatures;

  processExpressions(features: FacialFeatures, timestamp?: number): ExpressionResult;
  reset?(): void;
}

export class MediaPipeExpressionEngine implements IExpressionEngine {
  private smileDetector = new SmileDetector();
  private blinkDetector = new BlinkDetector();
  private mouthOpenDetector = new MouthOpenDetector();
  private eyeContactDetector = new EyeContactDetector();
  private headPoseDetector = new HeadPoseDetector();
  private eyebrowRaiseDetector = new EyebrowRaiseDetector();
  private frownDetector = new FrownDetector();
  private faceVisibilityDetector = new FaceVisibilityDetector();

  extractFeatures(
    landmarks: Point3D[] | undefined,
    faceCount: number,
    blendshapes?: Classifications,
    transformationMatrix?: number[][]
  ): FacialFeatures {
    const visibility = extractFaceVisibility(landmarks, faceCount);

    if (visibility.isMissing || !landmarks || landmarks.length === 0) {
      return {
        eyeOpening: { leftEAR: 0, rightEAR: 0, averageEAR: 0 },
        blink: { isBlinking: false, leftBlink: false, rightBlink: false },
        gaze: { x: 0, y: 0, isEyeContact: false, direction: "center" },
        headPose: { pitch: 0, yaw: 0, roll: 0, isStable: false },
        mouth: { width: 0, height: 0, mar: 0, isOpen: false, smileRatio: 0, isSmiling: false },
        eyebrows: { height: 0, isRaised: false, isFrowning: false },
        jawMovement: 0,
        visibility,
      };
    }

    // Extract blendshape category scores if present
    const categories = blendshapes?.categories || [];
    const categoryMap = new Map<string, number>();
    categories.forEach((cat) => categoryMap.set(cat.categoryName, cat.score));

    const eyeOpening = extractEyeOpening(landmarks);
    const blink = extractBlinkState(
      eyeOpening,
      categoryMap.get("eyeBlinkLeft"),
      categoryMap.get("eyeBlinkRight")
    );
    const headPose = extractHeadRotation(landmarks, transformationMatrix);
    const gaze = extractEyeGaze(landmarks, headPose.yaw, headPose.pitch);
    const mouth = extractMouthMetrics(
      landmarks,
      categoryMap.get("mouthSmileLeft"),
      categoryMap.get("mouthSmileRight")
    );
    const eyebrows = extractEyebrowMetrics(
      landmarks,
      categoryMap.get("browDownLeft"),
      categoryMap.get("browDownRight"),
      categoryMap.get("browOuterUpLeft"),
      categoryMap.get("browOuterUpRight")
    );

    const jawMovement = categoryMap.get("jawOpen") || mouth.mar;

    return {
      eyeOpening,
      blink,
      gaze,
      headPose,
      mouth,
      eyebrows,
      jawMovement,
      visibility,
    };
  }

  processExpressions(features: FacialFeatures, timestamp: number = Date.now()): ExpressionResult {
    const smileRes = this.smileDetector.detect(features);
    const blinkRes = this.blinkDetector.detect(features, timestamp);
    const mouthRes = this.mouthOpenDetector.detect(features);
    const eyeContactRes = this.eyeContactDetector.detect(features);
    const headPoseRes = this.headPoseDetector.detect(features);
    const eyebrowRaised = this.eyebrowRaiseDetector.detect(features);
    const isFrowning = this.frownDetector.detect(features);
    const visibilityStatus = this.faceVisibilityDetector.detect(features);

    return {
      smileScore: smileRes.smileScore,
      isSmiling: smileRes.isSmiling,
      isBlinking: blinkRes.isBlinking,
      blinkRatePerMin: blinkRes.blinkRatePerMin,
      isMouthOpen: mouthRes.isOpen,
      isEyeContact: eyeContactRes.isEyeContact,
      gazeDirection: eyeContactRes.direction,
      headPose: headPoseRes,
      isEyebrowRaised: eyebrowRaised,
      isFrowning,
      visibilityStatus,
    };
  }

  reset(): void {
    this.blinkDetector.reset();
  }
}
