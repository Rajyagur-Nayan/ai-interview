export interface ExpressionResult {
  smileScore: number; // 0 to 1
  isSmiling: boolean;
  isBlinking: boolean;
  blinkRatePerMin: number;
  isMouthOpen: boolean;
  isEyeContact: boolean;
  gazeDirection: "center" | "left" | "right" | "up" | "down";
  headPose: {
    pitch: number;
    yaw: number;
    roll: number;
    isStable: boolean;
  };
  isEyebrowRaised: boolean;
  isFrowning: boolean;
  visibilityStatus: "visible" | "missing" | "occluded" | "out_of_frame";
}
