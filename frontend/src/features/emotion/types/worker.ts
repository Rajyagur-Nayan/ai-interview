import { Point3D } from "./landmarks";
import { FacialFeatures } from "./features";
import { ExpressionResult } from "./expressions";
import { InterviewBehaviorMetrics } from "./behavior";

export type WorkerCommandType = "INIT" | "PROCESS_FRAME" | "STOP";

export interface InitWorkerMessage {
  type: "INIT";
  wasmPath?: string;
  modelPath?: string;
  targetFps?: number;
}

export interface ProcessFrameWorkerMessage {
  type: "PROCESS_FRAME";
  imageBitmap: ImageBitmap;
  timestamp: number;
}

export interface StopWorkerMessage {
  type: "STOP";
}

export type WorkerIncomingMessage =
  | InitWorkerMessage
  | ProcessFrameWorkerMessage
  | StopWorkerMessage;

export interface FrameResultData {
  landmarks: Point3D[];
  features: FacialFeatures;
  expressions: ExpressionResult;
  behavior: InterviewBehaviorMetrics;
  timestamp: number;
}

export interface WorkerInitializedMessage {
  type: "INITIALIZED";
  success: boolean;
  error?: string;
}

export interface WorkerResultMessage {
  type: "FRAME_RESULT";
  data: FrameResultData;
}

export interface WorkerErrorMessage {
  type: "ERROR";
  error: string;
}

export type WorkerOutgoingMessage =
  | WorkerInitializedMessage
  | WorkerResultMessage
  | WorkerErrorMessage;
