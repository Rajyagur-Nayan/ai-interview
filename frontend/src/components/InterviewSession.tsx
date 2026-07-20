"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import {
  Play,
  Cpu,
  Mic,
  Square,
  Loader2,
  Sparkles,
  AlertCircle,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Video,
  VideoOff,
} from "lucide-react";
import * as faceapi from "face-api.js";
import { useInterview } from "@/hooks/useInterview";
import { useSpeech } from "@/hooks/useSpeech";
import { useEvaluation } from "@/hooks/useEvaluation";
import { useReport } from "@/hooks/useReport";

export default function InterviewSession() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();

  // Groq AI modular hooks
  const { transcribe, isTranscribing } = useSpeech();
  const { evaluate, isEvaluating } = useEvaluation();
  const { generateReport, isGeneratingReport } = useReport();
  const { interviewData, fetchLoading, fetchError, refetch, generateFollowUp } =
    useInterview(id);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Camera & face-api states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoadedSuccessfully, setModelsLoadedSuccessfully] =
    useState(false);
  const [detectedEmotion, setDetectedEmotion] =
    useState<string>("Initializing...");
  const [emotionLog, setEmotionLog] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const questions = interviewData?.questions || [];
  const currentQuestion = questions[currentIdx];
  const totalQuestions = interviewData?.totalQuestions || questions.length;

  // Track currentIdx dynamically based on database answers
  useEffect(() => {
    if (interviewData) {
      if (interviewData.status === "completed") {
        router.push(`/report/${id}`);
        return;
      }
      if (interviewData.questions && interviewData.answers) {
        const unansweredIdx = interviewData.questions.findIndex(
          (q: any) =>
            !interviewData.answers.some((a: any) => a.questionId === q.id),
        );
        if (unansweredIdx !== -1) {
          setCurrentIdx(unansweredIdx);
        } else {
          setCurrentIdx(Math.max(0, interviewData.questions.length - 1));
        }
      }
    }
  }, [interviewData, id, router]);

  // TTS Voice Synthesis for Questions
  const speakQuestion = () => {
    if (!currentQuestion) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      currentQuestion.questionText,
    );
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const defaultVoice =
      voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (defaultVoice) utterance.voice = defaultVoice;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentQuestion) {
      speakQuestion();
    }
  }, [currentIdx, currentQuestion]);

  // Load face-api weights
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setModelsLoadedSuccessfully(true);
        setDetectedEmotion("Neutral / Focused");
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        setModelsLoaded(true);
        setModelsLoadedSuccessfully(false);
        setDetectedEmotion("Focused");
      }
    }
    loadModels();
  }, []);

  // Handle webcam streaming and expression detection
  useEffect(() => {
    let isMounted = true;
    let detectInterval: any = null;
    let localStream: MediaStream | null = null;

    async function startVideo() {
      if (!cameraActive) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 400, height: 300, facingMode: "user" },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStream = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (modelsLoaded && modelsLoadedSuccessfully) {
          detectInterval = setInterval(async () => {
            const video = videoRef.current;
            if (
              video &&
              cameraActive &&
              video.readyState >= 2 &&
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              try {
                const detections = await faceapi
                  .detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions(),
                  )
                  .withFaceExpressions();

                if (detections && isMounted) {
                  const expressions: any = detections.expressions;
                  let maxExpr = "neutral";
                  let maxVal = 0;
                  Object.keys(expressions).forEach((key) => {
                    if (expressions[key] > maxVal) {
                      maxVal = expressions[key];
                      maxExpr = key;
                    }
                  });

                  const capitalized =
                    maxExpr.charAt(0).toUpperCase() + maxExpr.slice(1);
                  setDetectedEmotion(capitalized);

                  setEmotionLog((prev) => [
                    ...prev,
                    {
                      timestamp: new Date(),
                      emotion: capitalized,
                      confidence: maxVal,
                    },
                  ]);
                }
              } catch (err) {
                console.debug("Face detection tick error:", err);
              }
            }
          }, 1000);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Camera access failed:", error);
        }
      }
    }

    if (modelsLoaded) {
      startVideo();
    }

    return () => {
      isMounted = false;
      if (detectInterval) clearInterval(detectInterval);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [modelsLoaded, cameraActive]);

  // Audio Recorder logic
  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(audioStream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        audioStream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!currentQuestion) return;

      let transcriptText = "";
      if (audioBlob) {
        const result = await transcribe(audioBlob, currentQuestion.id);
        transcriptText = result.transcript;
      } else {
        transcriptText = "This is technical practice verbal input.";
      }

      // 2. Evaluate answer using Llama 3.1 8B (combined technical & communication scores)
      await evaluate(currentQuestion.id, transcriptText, emotionLog);

      // Check if this is the last question
      const isLastQuestion =
        currentIdx >= totalQuestions - 1 || currentIdx >= questions.length - 1;

      if (isLastQuestion) {
        // 3. Compile final report
        await generateReport(id);
        return { finished: true };
      } else {
        // 4. Generate follow-up question
        await generateFollowUp(currentQuestion.questionText, transcriptText);
        return { finished: false };
      }
    },
    onSuccess: (data) => {
      setAudioBlob(null);
      setAudioUrl(null);
      setEmotionLog([]);

      if (data?.finished) {
        router.push(`/report/${id}`);
      } else {
        refetch();
      }
    },
  });

  const handleNextSubmit = () => {
    submitMutation.mutate();
  };

  if (fetchLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3 min-h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
        <p className="text-sm font-semibold text-neutral-600">
          Loading practice workspace configuration...
        </p>
      </div>
    );
  }

  if (fetchError || !interviewData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3 min-h-screen bg-white">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm font-semibold text-neutral-600">
          Error fetching interview session workspace
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen text-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200/60 bg-white/80 backdrop-blur z-20 h-[72px] flex items-center">
        <div className="max-w-[1280px] w-full mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-green-500" />
            <span className="font-extrabold text-sm tracking-wide text-neutral-800">
              {interviewData.role} • {interviewData.difficulty} Tier
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-green-100 border border-green-200/50 text-green-700 px-4 py-1.5 rounded-full font-bold">
              QUESTION {currentIdx + 1} OF {questions.length}
            </span>
          </div>
        </div>
      </header>

      {/* Grid Panels */}
      <div className="max-w-[1280px] mx-auto px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 w-full">
        {/* Left Side */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-8">
          <div className="bg-white border border-neutral-200/80 p-8 rounded-[28px] flex-1 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">
                  Active Question
                </span>
                <button
                  onClick={speakQuestion}
                  className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 transition-colors bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 px-3.5 py-2 rounded-full cursor-pointer font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Read Aloud
                </button>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-neutral-900 leading-snug">
                {currentQuestion?.questionText}
              </h2>
            </div>

            <div className="mt-8 border-t border-neutral-100 pt-6">
              <p className="text-xs text-neutral-500 font-extrabold mb-2.5 uppercase tracking-wider">
                HOW TO ANSWER:
              </p>
              <ul className="text-xs text-neutral-400 space-y-2 list-disc list-inside font-medium leading-relaxed">
                <li>Click the microphone icon below to start recording.</li>
                <li>Ensure you talk clearly into your microphone device.</li>
                <li>
                  Once finished, click stop and review your voice response
                  before submitting.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-[#F8FAF8] border border-neutral-200/80 p-6 rounded-[28px] flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="flex items-center gap-6">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 hover:shadow-red-500/40 transition-all cursor-pointer animate-pulse"
                >
                  <Square className="w-5 h-5 fill-white text-white" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={submitMutation.isPending}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center justify-center text-white shadow-md shadow-green-500/15 hover:scale-[1.03] transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>

            <div>
              {isRecording ? (
                <div className="flex items-center gap-2 text-red-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Recording... {Math.floor(recordingSeconds / 60)}:
                    {(recordingSeconds % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              ) : audioBlob ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-green-600 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Response audio ready
                  </span>
                  <audio
                    src={audioUrl || ""}
                    controls
                    className="mt-2 h-9 w-60 focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Click microphone to speak
                </span>
              )}
            </div>

            {audioBlob && !isRecording && (
              <button
                onClick={handleNextSubmit}
                disabled={submitMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-full text-sm hover:scale-[1.02] shadow-md shadow-green-500/15 transition-all duration-300 h-12 cursor-pointer disabled:opacity-50"
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isTranscribing
                      ? "Transcribing Voice Response..."
                      : isEvaluating
                        ? "Evaluating Answer & Composure..."
                        : isGeneratingReport
                          ? "Compiling Comprehensive Report..."
                          : "Analyzing and Evaluating..."}
                  </span>
                ) : (
                  <>
                    Submit Answer
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="bg-[#F8FAF8] border border-neutral-200/80 rounded-[28px] overflow-hidden relative aspect-video flex flex-col items-center justify-center shadow-sm">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                />
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <VideoOff className="w-12 h-12" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Camera is deactivated
                </span>
              </div>
            )}

            <button
              onClick={() => setCameraActive(!cameraActive)}
              className="absolute bottom-4 right-4 bg-white/90 backdrop-blur hover:bg-white text-neutral-800 rounded-full p-3 transition-all cursor-pointer border border-neutral-200 shadow-sm"
            >
              {cameraActive ? (
                <VideoOff className="w-4.5 h-4.5" />
              ) : (
                <Video className="w-4.5 h-4.5" />
              )}
            </button>
          </div>

          <div className="bg-white border border-neutral-200/80 p-6 rounded-[28px] flex-1 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Emotion Telemetry
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Client-Side Biometrics
              </h3>
              <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed font-medium">
                Real-time analysis overlays your facial expressions to track
                focus and calmness indicators during questions.
              </p>

              <div className="mt-6 p-4 rounded-full bg-[#F8FAF8] border border-neutral-200 flex justify-between items-center px-6">
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Active Expression
                </span>
                <span className="text-sm font-extrabold text-green-600 text-glow">
                  {detectedEmotion}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-6">
              <span className="text-xs text-neutral-500 font-extrabold uppercase tracking-wider">
                FEEDBACK INDICATORS:
              </span>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-neutral-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Focused Focus
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-300" />
                  Calm Expression
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
