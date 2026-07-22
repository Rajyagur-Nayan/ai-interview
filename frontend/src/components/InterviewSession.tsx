"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import {
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
import { useInterview } from "@/hooks/useInterview";
import { useSpeech } from "@/hooks/useSpeech";
import { useEvaluation } from "@/hooks/useEvaluation";
import { useReport } from "@/hooks/useReport";
import { useEmotionDetection } from "@/hooks/useEmotionDetection";
import { BehaviorAnalyticsOverlay } from "@/features/emotion";

export default function InterviewSession() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  useAuthStore();

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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Integrated Camera & MediaPipe behavior analysis hook
  const [cameraActive, setCameraActive] = useState(true);
  const {
    videoRef,
    detectedEmotion,
    emotionLog,
    resetLog,
    modelsLoaded,
    liveMetrics,
    liveExpressions,
    faceStatus,
    startAnswerTracking,
    stopAnswerTracking,
    workerError,
  } = useEmotionDetection(cameraActive);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
          (q: { id: string; questionText: string }) =>
            !interviewData.answers.some((a: { questionId: string }) => a.questionId === q.id)
        );
        if (unansweredIdx !== -1) {
          setCurrentIdx(unansweredIdx);
        } else {
          setCurrentIdx(Math.max(0, interviewData.questions.length - 1));
        }
      }
    }
  }, [interviewData, id, router]);

  // Start tracking answer biometrics whenever currentQuestion changes
  useEffect(() => {
    if (currentQuestion) {
      startAnswerTracking(currentQuestion.id);
    }
  }, [currentQuestion, startAnswerTracking]);

  // TTS Voice Synthesis for Questions
  const speakQuestion = useCallback(() => {
    if (!currentQuestion) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.questionText);
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const defaultVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (defaultVoice) utterance.voice = defaultVoice;
    window.speechSynthesis.speak(utterance);
  }, [currentQuestion]);

  useEffect(() => {
    if (currentQuestion) {
      speakQuestion();
    }
  }, [currentIdx, currentQuestion, speakQuestion]);

  // Audio Recorder logic
  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      if (!currentQuestion) return { finished: false };

      let transcriptText = "";
      if (audioBlob) {
        const result = await transcribe(audioBlob, currentQuestion.id);
        transcriptText = result.transcript;
      } else {
        transcriptText = "This is technical practice verbal input.";
      }

      // Stop answer tracking & retrieve summarized analytics
      const summaryAnalytics = stopAnswerTracking();
      const analyticsData = summaryAnalytics || emotionLog;

      // Evaluate answer using Llama 3.1 8B with summarized biometrics JSON
      await evaluate(currentQuestion.id, transcriptText, analyticsData as any);

      // Check if this is the last question
      const isLastQuestion = currentIdx >= totalQuestions - 1 || currentIdx >= questions.length - 1;

      if (isLastQuestion) {
        await generateReport(id);
        return { finished: true };
      } else {
        await generateFollowUp(currentQuestion.questionText, transcriptText);
        return { finished: false };
      }
    },
    onSuccess: (data: { finished: boolean }) => {
      setAudioBlob(null);
      setAudioUrl(null);
      resetLog();

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
                <li>Once finished, click stop and review your voice response before submitting.</li>
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
                  <audio src={audioUrl || ""} controls className="mt-2 h-9 w-60 focus:outline-none" />
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
                        ? "Evaluating Answer & Behavior..."
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
              {cameraActive ? <VideoOff className="w-4.5 h-4.5" /> : <Video className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Behavior Analytics Overlay Panel */}
          {liveMetrics && liveExpressions && (
            <BehaviorAnalyticsOverlay
              metrics={liveMetrics}
              expressions={liveExpressions}
              faceStatus={faceStatus}
              isWorkerReady={modelsLoaded}
              workerError={workerError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
