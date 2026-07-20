"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Sparkles,
  Cpu,
  Sliders,
  Loader2,
  Play,
  Award,
  ShieldAlert,
  Target,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

const setupSchema = z.object({
  jobRole: z.string().min(1, "Job role is required"),
  experienceLevel: z.string().min(1, "Experience level is required"),
  difficulty: z.string().min(1, "Difficulty level is required"),
  numberOfQuestions: z
    .number()
    .int()
    .min(1, "At least 1 question")
    .max(15, "At most 15 questions"),
});

type SetupFields = z.infer<typeof setupSchema>;

export default function InterviewSetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SetupFields>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      jobRole: "Frontend Engineer",
      experienceLevel: "Mid Level",
      difficulty: "Medium",
      numberOfQuestions: 5,
    },
  });

  const selectedJobRole = watch("jobRole");
  const selectedExpLevel = watch("experienceLevel");
  const selectedDifficulty = watch("difficulty");
  const questionsCount = watch("numberOfQuestions");

  // Mutation to save setup and start interview
  const setupAndStartMutation = useMutation({
    mutationFn: async (data: SetupFields) => {
      // 1. Create interview configuration
      const setupRes = await api.post("/interview-setups", {
        jobRole: data.jobRole,
        experienceLevel: data.experienceLevel,
        difficulty: data.difficulty,
        numberOfQuestions: data.numberOfQuestions,
      });
      const savedSetup = setupRes.data.data;

      // 2. Start interview using setupId
      const interviewRes = await api.post("/interviews/start", {
        setupId: savedSetup.id,
      });
      return interviewRes.data.data;
    },
    onSuccess: (data) => {
      router.push(`/interview/${data.interview.id}`);
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
          "Failed to start mock session. Try again.",
      );
    },
  });

  const onSubmit = (data: SetupFields) => {
    setError(null);
    setupAndStartMutation.mutate(data);
  };

  const jobRoles = [
    "Frontend Engineer",
    "Backend Engineer",
    "Fullstack Developer",
    "Data Engineer",
    "Product Manager",
  ];

  const experienceLevels = [
    "Entry Level",
    "Junior Developer",
    "Mid Level",
    "Senior Engineer",
    "Lead / Principal",
  ];

  const difficulties = ["Easy", "Medium", "Hard"];

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen relative overflow-hidden text-neutral-900">
      {/* Background Glowing Blurs */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-neutral-200/60 bg-white/80 backdrop-blur z-20 sticky top-0 h-[72px] flex items-center">
        <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-green-400 flex items-center justify-center shadow-sm shadow-green-500/10">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-neutral-900">
              AI Interviewer
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white hover:bg-neutral-50 px-4 h-9 rounded-full transition-all duration-300 shadow-sm cursor-pointer font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-3xl mx-auto px-6 py-16 flex-1 w-full relative z-10 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-bold mb-4 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Tailor Your Assessment
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">
            Interview Setup Configuration
          </h1>
          <p className="text-neutral-500 text-sm mt-2.5 max-w-lg mx-auto leading-relaxed">
            Choose your options below. Our Grok AI will generate customized
            technical questions matching these precise filters.
          </p>
        </div>

        <div className="bg-white border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 rounded-[28px]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600 text-sm font-medium flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Role Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Target className="w-4.5 h-4.5 text-green-500" />
                  Target Job Role
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedJobRole}
                    onChange={(e) => setValue("jobRole", e.target.value)}
                    className="w-full h-12 bg-white border border-neutral-200 hover:border-neutral-300 rounded-full py-2.5 px-4 text-sm text-neutral-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 cursor-pointer transition-colors"
                  >
                    {jobRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.jobRole && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.jobRole.message}
                  </p>
                )}
              </div>

              {/* Experience Level Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Award className="w-4.5 h-4.5 text-green-500" />
                  Experience Tier
                </label>
                <select
                  value={selectedExpLevel}
                  onChange={(e) => setValue("experienceLevel", e.target.value)}
                  className="w-full h-12 bg-white border border-neutral-200 hover:border-neutral-300 rounded-full py-2.5 px-4 text-sm text-neutral-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 cursor-pointer transition-colors"
                >
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                {errors.experienceLevel && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.experienceLevel.message}
                  </p>
                )}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-green-500" />
                Assessment Difficulty
              </label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setValue("difficulty", diff)}
                    className={`py-3 text-sm font-bold rounded-full border transition-all duration-300 cursor-pointer ${
                      selectedDifficulty === diff
                        ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/15"
                        : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              {errors.difficulty && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">
                  {errors.difficulty.message}
                </p>
              )}
            </div>

            {/* Questions count slider */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4.5 h-4.5 text-green-500" />
                  Number of Questions
                </label>
                <span className="text-xs font-extrabold text-green-700 bg-green-100 border border-green-200/50 rounded-full px-3 py-1">
                  {questionsCount}{" "}
                  {questionsCount === 1 ? "Question" : "Questions"}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={questionsCount}
                onChange={(e) =>
                  setValue("numberOfQuestions", parseInt(e.target.value))
                }
                className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-green-500 border border-neutral-200"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider px-1">
                <span>1 Min</span>
                <span>5 Typical</span>
                <span>10 Detailed</span>
                <span>15 Extensive</span>
              </div>
              {errors.numberOfQuestions && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">
                  {errors.numberOfQuestions.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 text-center py-3.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-full text-sm font-bold text-neutral-500 hover:text-neutral-700 transition-all duration-300 cursor-pointer flex items-center justify-center h-12"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={setupAndStartMutation.isPending}
                className="flex-[2] h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full py-3.5 text-sm font-bold shadow-md shadow-green-500/15 hover:scale-[1.03] transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {setupAndStartMutation.isPending ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Generating AI Questions...
                  </>
                ) : (
                  <>
                    Initialize Session
                    <Play className="w-4.5 h-4.5 fill-white text-white" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
