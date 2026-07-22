import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { MediaPipeExpressionEngine } from "../services/ExpressionEngine";
import { BehaviorEngine } from "../services/BehaviorEngine";
import { WorkerIncomingMessage } from "../types/worker";

let faceLandmarker: FaceLandmarker | null = null;
const expressionEngine = new MediaPipeExpressionEngine();
const behaviorEngine = new BehaviorEngine();

ctxWorkerInit();

function ctxWorkerInit() {
  self.onmessage = async (event: MessageEvent<WorkerIncomingMessage>) => {
    const message = event.data;

    switch (message.type) {
      case "INIT": {
        try {
          const wasmLocation = message.wasmPath || "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
          const modelLocation = message.modelPath || "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

          const vision = await FilesetResolver.forVisionTasks(wasmLocation);

          try {
            // Attempt GPU delegate first
            faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: modelLocation,
                delegate: "GPU",
              },
              runningMode: "IMAGE",
              numFaces: 1,
              outputFaceBlendshapes: true,
              outputFacialTransformationMatrixes: true,
            });
          } catch (gpuError) {
            console.warn("GPU delegate unavailable in worker, falling back to CPU:", gpuError);
            faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: modelLocation,
                delegate: "CPU",
              },
              runningMode: "IMAGE",
              numFaces: 1,
              outputFaceBlendshapes: true,
              outputFacialTransformationMatrixes: true,
            });
          }

          self.postMessage({ type: "INITIALIZED", success: true });
        } catch (err: any) {
          console.error("Failed to initialize MediaPipe FaceLandmarker worker:", err);
          self.postMessage({
            type: "INITIALIZED",
            success: false,
            error: err?.message || "MediaPipe initialization failed",
          });
        }
        break;
      }

      case "PROCESS_FRAME": {
        const { imageBitmap, timestamp } = message;

        if (!faceLandmarker) {
          imageBitmap.close();
          self.postMessage({ type: "ERROR", error: "FaceLandmarker is not initialized" });
          return;
        }

        try {
          // Detect landmarks from ImageBitmap frame
          const result = faceLandmarker.detect(imageBitmap);

          // Close bitmap immediately after detection to prevent memory leaks
          imageBitmap.close();

          const faceLandmarks = result.faceLandmarks?.[0] || [];
          const faceCount = result.faceLandmarks?.length || 0;
          const blendshapes = result.faceBlendshapes?.[0];
          const rawMatrix = result.facialTransformationMatrixes?.[0];
          // Cast MediaPipe Matrix (flat typed array) to number[][] for our extraction layer
          const matrix = rawMatrix ? (rawMatrix as unknown as number[][]) : undefined;

          // 1. Feature Extraction Layer
          const features = expressionEngine.extractFeatures(
            faceLandmarks,
            faceCount,
            blendshapes,
            matrix
          );

          // 2. Expression Detection Engine Layer
          const expressions = expressionEngine.processExpressions(features, timestamp);

          // 3. Interview Behavior Engine Layer
          const behavior = behaviorEngine.calculateMetrics(features, expressions);

          self.postMessage({
            type: "FRAME_RESULT",
            data: {
              landmarks: faceLandmarks,
              features,
              expressions,
              behavior,
              timestamp,
            },
          });
        } catch (procErr: any) {
          imageBitmap.close();
          console.error("Frame processing error in worker:", procErr);
          self.postMessage({ type: "ERROR", error: procErr?.message || "Frame processing failed" });
        }
        break;
      }

      case "STOP": {
        if (faceLandmarker) {
          faceLandmarker.close();
          faceLandmarker = null;
        }
        expressionEngine.reset();
        behaviorEngine.reset();
        break;
      }
    }
  };
}
