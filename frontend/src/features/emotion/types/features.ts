export interface EyeOpeningMetric {
  leftEAR: number;
  rightEAR: number;
  averageEAR: number;
}

export interface EyeBlinkMetric {
  isBlinking: boolean;
  leftBlink: boolean;
  rightBlink: boolean;
}

export interface EyeGazeMetric {
  x: number; // -1 (left) to +1 (right)
  y: number; // -1 (up) to +1 (down)
  isEyeContact: boolean;
  direction: "center" | "left" | "right" | "up" | "down";
}

export interface HeadRotationMetric {
  pitch: number; // looking up/down in degrees
  yaw: number;   // looking left/right in degrees
  roll: number;  // tilt left/right in degrees
  isStable: boolean;
}

export interface MouthMetric {
  width: number;
  height: number;
  mar: number; // Mouth Aspect Ratio
  isOpen: boolean;
  smileRatio: number; // 0 to 1
  isSmiling: boolean;
}

export interface EyebrowMetric {
  height: number;
  isRaised: boolean;
  isFrowning: boolean;
}

export interface FaceVisibilityMetric {
  isVisible: boolean;
  isMissing: boolean;
  isOccluded: boolean;
  isOutOfFrame: boolean;
  occludedPercent: number;
  outOfFramePercent: number;
  faceCount: number;
}

export interface FacialFeatures {
  eyeOpening: EyeOpeningMetric;
  blink: EyeBlinkMetric;
  gaze: EyeGazeMetric;
  headPose: HeadRotationMetric;
  mouth: MouthMetric;
  eyebrows: EyebrowMetric;
  jawMovement: number;
  visibility: FaceVisibilityMetric;
}
