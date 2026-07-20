"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  Award,
  Cpu,
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Activity,
  Star,
  MessageSquare,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Download,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function ReportPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch report data
  const {
    data: reportData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interview-report", id],
    queryFn: async () => {
      const res = await api.get(`/interviews/report/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3 min-h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
        <p className="text-sm font-semibold text-neutral-600">
          Generating report summary metrics...
        </p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3 min-h-screen bg-white">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm font-semibold text-neutral-600">
          Unable to fetch evaluation report
        </p>
      </div>
    );
  }

  const { role, difficulty, createdAt, questions, answers } = reportData;

  // Calculate scores
  const scoreAnswers = answers.filter((a: any) => a.score !== null);
  const averageScore =
    scoreAnswers.length > 0
      ? Math.round(
          scoreAnswers.reduce((sum: number, a: any) => sum + a.score, 0) /
            scoreAnswers.length,
        )
      : 0;

  // Load reportData from backend or prepare fallback
  const report = reportData.reportData || {
    technicalScore: averageScore,
    communicationScore: Math.max(50, averageScore - 5),
    confidenceScore: Math.max(50, averageScore + 2),
    emotionSummary:
      "composure telemetry logged neutrality and focus metrics throughout questions.",
    strengths: [
      "Shows foundational conceptual coding structure",
      "Maintained clear articulation pace",
    ],
    weaknesses: [
      "Could deepen practical architecture specifics",
      "Increase modular design detail",
    ],
    recommendations: [
      "Review common systems design architectures",
      "Supplement explanations with actual code snippet references",
    ],
  };

  // Helpers to fetch answer for question
  const getAnswerForQuestion = (qid: string) => {
    return answers.find((a: any) => a.questionId === qid);
  };

  // Helper to compile emotions logged
  const compileEmotionPercentages = (emotionsList: any[]) => {
    if (!emotionsList || emotionsList.length === 0) return "Neutral (100%)";
    const counts: { [key: string]: number } = {};
    emotionsList.forEach((e: any) => {
      if (e.emotion) {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
      }
    });

    const total = emotionsList.length;
    return Object.keys(counts)
      .map((key) => `${key} (${Math.round((counts[key] / total) * 100)}%)`)
      .slice(0, 3)
      .join(", ");
  };

  // Format charts data
  const chartData = [
    {
      subject: "Technical Accuracy",
      score: report.technicalScore,
      fullMark: 100,
    },
    {
      subject: "Communication Clarity",
      score: report.communicationScore,
      fullMark: 100,
    },
    {
      subject: "Confidence Indicator",
      score: report.confidenceScore,
      fullMark: 100,
    },
  ];

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen text-neutral-900">
      {/* Print custom stylesheet override */}
      <style jsx global>{`
        @media print {
          body,
          html {
            background: #ffffff !important;
            color: #111111 !important;
            font-size: 12px;
          }
          header,
          button,
          nav,
          footer,
          .no-print,
          .back-btn,
          .download-btn {
            display: none !important;
          }
          .glass {
            border: 1px solid #e2e8f0 !important;
            background: #ffffff !important;
            color: #111111 !important;
            box-shadow: none !important;
            border-radius: 12px !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          h1,
          h2,
          h3,
          p,
          span,
          div {
            color: #111111 !important;
            text-shadow: none !important;
          }
          .text-primary,
          .text-glow {
            color: #22c55e !important;
            text-shadow: none !important;
          }
          .bg-primary\/5,
          .bg-primary\/10 {
            background-color: #f3f4f6 !important;
            border-color: #d1d5db !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 250px !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-neutral-200/60 bg-white/80 backdrop-blur sticky top-0 z-20 h-[72px] flex items-center no-print">
        <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-bold border border-neutral-200 bg-white hover:bg-neutral-50 px-4 h-9 rounded-full transition-all duration-300 shadow-sm back-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-green-500" />
              <span className="font-extrabold text-sm text-neutral-900">
                AI Evaluation Report
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1024px] mx-auto px-6 py-12 w-full space-y-10">
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
              {role}
            </h1>
            <p className="text-neutral-400 text-sm mt-1.5 flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-neutral-400" />
              Interview completed on{" "}
              {new Date(createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border border-neutral-200 hover:border-neutral-350 hover:bg-neutral-50 text-neutral-700 text-xs font-bold px-5 h-11 rounded-full transition-all duration-300 cursor-pointer shadow-sm no-print"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              Download PDF Report
            </button>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-bold tracking-wide uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed Session
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-green-550/10 border border-green-500/20 flex items-center justify-center text-green-600">
              <Star className="w-5.5 h-5.5 fill-green-600" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Overall Score
              </p>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {averageScore}{" "}
                <span className="text-xs text-neutral-400 font-bold">
                  / 100
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-5.5 h-5.5 text-blue-600" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Technical Score
              </p>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {report.technicalScore}{" "}
                <span className="text-xs text-neutral-400 font-bold">
                  / 100
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600">
              <UserCheck className="w-5.5 h-5.5 text-green-600" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Communication
              </p>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {report.communicationScore}{" "}
                <span className="text-xs text-neutral-400 font-bold">
                  / 100
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Activity className="w-5.5 h-5.5 text-amber-600" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Confidence Score
              </p>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {report.confidenceScore}{" "}
                <span className="text-xs text-neutral-400 font-bold">
                  / 100
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Chart & Emotion telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Chart Widget */}
          <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] md:col-span-3 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-neutral-900">
                Performance Dimension Analysis
              </h3>
              <p className="text-xs text-neutral-400 mt-1 font-medium">
                Evaluation across technical correctness, confidence parameters,
                and clarity.
              </p>
            </div>

            <div className="h-64 mt-6 w-full flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="subject"
                      tick={{
                        fill: "#6b7280",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{
                        fill: "#6b7280",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e5e7eb",
                        borderRadius: "12px",
                        color: "#111827",
                      }}
                    />
                    <Bar
                      dataKey="score"
                      fill="#22c55e"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  <span className="text-xs">Loading chart widget...</span>
                </div>
              )}
            </div>
          </div>

          {/* Emotion Analytics Summary */}
          <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] md:col-span-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Biometric Summary
              </div>
              <h3 className="text-lg font-extrabold text-neutral-900">
                Behavioral Telemetry
              </h3>
              <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                We analyzed client-side micro-expression telemetry points
                captured during your webcam stream to evaluate focus indicators.
              </p>

              <div className="mt-4 p-4 rounded-2xl bg-[#F8FAF8] border border-neutral-200">
                <p className="text-xs text-neutral-700 font-bold leading-relaxed italic">
                  "{report.emotionSummary}"
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100 grid grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <span className="text-neutral-400 font-bold block uppercase tracking-wider">
                  Difficulty Level
                </span>
                <span className="text-neutral-800 font-black mt-1 block">
                  {difficulty}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 font-bold block uppercase tracking-wider">
                  Evaluation Level
                </span>
                <span className="text-green-600 font-black mt-1 block">
                  {averageScore >= 85
                    ? "Distinction"
                    : averageScore >= 70
                      ? "Competent"
                      : "Practice Recommended"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths Card */}
          <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] border-l-4 border-l-green-500">
            <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
              Key Strengths & Highlights
            </h3>
            <ul className="mt-5 space-y-3">
              {report.strengths.map((str: string, index: number) => (
                <li
                  key={index}
                  className="text-neutral-700 text-xs font-bold flex items-start gap-2.5 leading-relaxed bg-[#F8FAF8] px-4 py-3 rounded-2xl border border-neutral-200/60"
                >
                  <span className="text-green-500 font-black mt-0.5 shrink-0">
                    ✓
                  </span>
                  {str}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses Card */}
          <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] border-l-4 border-l-amber-500">
            <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              Areas for Improvement
            </h3>
            <ul className="mt-5 space-y-3">
              {report.weaknesses.map((weak: string, index: number) => (
                <li
                  key={index}
                  className="text-neutral-700 text-xs font-bold flex items-start gap-2.5 leading-relaxed bg-[#F8FAF8] px-4 py-3 rounded-2xl border border-neutral-200/60"
                >
                  <span className="text-amber-500 font-black mt-0.5 shrink-0">
                    !
                  </span>
                  {weak}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations block */}
        <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] border-l-4 border-l-green-500 space-y-4">
          <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-green-600" />
            Recruiter's Actionable Recommendations
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-bold">
            Based on core logic matching and biometric parameters, we recommend
            targeting the following prep checklist:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {report.recommendations.map((rec: string, index: number) => (
              <div
                key={index}
                className="text-neutral-700 text-xs font-bold bg-[#F8FAF8] border border-neutral-200/80 px-4 py-3.5 rounded-2xl flex items-center gap-3"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <span className="leading-normal">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Question-by-Question Diagnostics */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-neutral-900">
            Question-by-Question Diagnostics
          </h2>

          {questions.map((question: any, idx: number) => {
            const answer = getAnswerForQuestion(question.id);
            return (
              <div
                key={question.id}
                className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] space-y-6"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-neutral-100">
                  <div className="space-y-1">
                    <span className="text-xs text-neutral-400 font-extrabold uppercase tracking-wider">
                      Question {idx + 1}
                    </span>
                    <h3 className="text-lg font-extrabold text-neutral-900">
                      {question.questionText}
                    </h3>
                  </div>
                  {answer?.score !== null && (
                    <div className="bg-green-50 border border-green-200/50 text-green-600 px-4 py-2 rounded-2xl text-sm font-black text-glow shrink-0">
                      Score: {answer?.score}
                    </div>
                  )}
                </div>

                {/* Sub-details */}
                {answer ? (
                  <div className="space-y-5 text-sm font-medium">
                    {/* Transcript */}
                    <div className="space-y-2">
                      <span className="text-xs text-neutral-400 font-extrabold uppercase tracking-wider block">
                        Response Transcript
                      </span>
                      <p className="text-neutral-700 bg-[#F8FAF8] p-5 rounded-2xl border border-neutral-200 leading-relaxed font-bold">
                        "{answer.transcript}"
                      </p>
                    </div>

                    {/* Biometrics */}
                    <div className="space-y-2">
                      <span className="text-xs text-neutral-400 font-extrabold uppercase tracking-wider block">
                        Telemetry Biometrics
                      </span>
                      <p className="text-xs text-neutral-600 bg-[#F8FAF8] px-5 py-3.5 rounded-2xl border border-neutral-200 font-bold">
                        Top expressions:{" "}
                        {compileEmotionPercentages(answer.emotions)}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="space-y-2 pt-2">
                      <span className="text-xs text-green-600 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Grok AI Critique
                      </span>
                      <p className="text-neutral-700 leading-relaxed bg-green-500/5 border border-green-500/10 p-5 rounded-2xl font-bold">
                        {answer.evaluation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">
                    No answer submitted for this question.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
