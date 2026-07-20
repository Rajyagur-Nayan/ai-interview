"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { Cpu, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import TTSAudioPlayer from "@/components/TTSAudioPlayer";
import { useEmotionDetection } from "@/hooks/useEmotionDetection";
import CameraTelemetry from "@/components/CameraTelemetry";
import { useInterview } from "@/hooks/useInterview";
import { useSpeech } from "@/hooks/useSpeech";
import { useEvaluation } from "@/hooks/useEvaluation";
import { useReport } from "@/hooks/useReport";

export default function InterviewSessionPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Groq AI modular hooks
  const { transcribe, isTranscribing } = useSpeech();
  const { evaluate, isEvaluating } = useEvaluation();
  const { generateReport, isGeneratingReport } = useReport();
  const { interviewData, fetchLoading, fetchError, refetch, generateFollowUp } =
    useInterview(id);

  // Camera & face-api states hook integration
  const [cameraActive, setCameraActive] = useState(true);
  const {
    videoRef,
    detectedEmotion,
    emotionLog,
    resetLog,
    getEmotionSummary,
    modelsLoaded,
  } = useEmotionDetection(cameraActive);

  const questions = interviewData?.questions || [];
  const currentQuestion = questions[currentIdx];
  const totalQuestions = interviewData?.totalQuestions || 5;

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

  // Submit Answer mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!currentQuestion) return;

      let transcriptText = "";
      if (audioBlob) {
        // 1. Transcribe audio using Groq Whisper
        const sttResult = await transcribe(audioBlob, currentQuestion.id);
        transcriptText = sttResult.transcript;
      } else {
        transcriptText = "This is technical practice verbal input.";
      }

      // 2. Evaluate answer using Llama 3.1 8B (combined technical & communication scores)
      await evaluate(currentQuestion.id, transcriptText, emotionLog);

      // Check if this is the last question
      const allQuestions = interviewData?.questions || [];
      const isLastQuestion =
        currentIdx >= totalQuestions - 1 ||
        currentIdx >= allQuestions.length - 1;

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
        <AlertCircle className="w-12 h-12 text-red-550" />
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
        <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-green-500" />
            <span className="font-extrabold text-sm tracking-wide text-neutral-800">
              {interviewData.role} • {interviewData.difficulty} Tier
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-green-100 border border-green-200/50 text-green-700 px-4 py-1.5 rounded-full font-bold">
              QUESTION {currentIdx + 1} OF {totalQuestions}
            </span>
          </div>
        </div>
      </header>

      {/* Grid Panels */}
      <div className="max-w-[1280px] mx-auto px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 w-full">
        {/* Left Side: Question Display, Recorder UI */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-8">
          {/* Question Text */}
          <div className="bg-white border border-neutral-200/80 p-8 rounded-[28px] flex-1 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">
                  Active Question
                </span>
                <TTSAudioPlayer
                  text={currentQuestion?.questionText}
                  audioUrl={currentQuestion?.audioUrl}
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-neutral-900 leading-snug">
                {currentQuestion?.questionText}
              </h2>
            </div>

            {/* Answer guidelines */}
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

          {/* Audio Controls */}
          <div className="space-y-4">
            <AudioRecorder
              onRecordingComplete={(blob) => setAudioBlob(blob)}
              onReset={() => setAudioBlob(null)}
            />

            {submitMutation.isError && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Submission failed</p>
                  <p className="opacity-80 mt-1">
                    {submitMutation.error instanceof Error
                      ? submitMutation.error.message
                      : "A network error occurred. Please try again."}
                  </p>
                </div>
              </div>
            )}

            {audioBlob && (
              <button
                onClick={handleNextSubmit}
                disabled={submitMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-full text-sm hover:scale-[1.02] shadow-md shadow-green-500/15 transition-all duration-300 h-12 cursor-pointer disabled:opacity-50"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isTranscribing
                      ? "Transcribing Voice Response..."
                      : isEvaluating
                        ? "Evaluating Answer & Composure..."
                        : isGeneratingReport
                          ? "Compiling Comprehensive Report..."
                          : "Analyzing and Evaluating..."}
                  </>
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

        {/* Right Side: Cam Feed & AI Emotion Analytics */}
        <div className="lg:col-span-2 flex flex-col">
          <CameraTelemetry
            videoRef={videoRef}
            cameraActive={cameraActive}
            setCameraActive={setCameraActive}
            detectedEmotion={detectedEmotion}
            emotionLog={emotionLog}
            modelsLoaded={modelsLoaded}
            getEmotionSummary={getEmotionSummary}
          />
        </div>
      </div>
    </div>
  );
}
