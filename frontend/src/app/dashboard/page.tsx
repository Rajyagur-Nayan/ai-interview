"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  LogOut,
  Clock,
  Award,
  Cpu,
  BookOpen,
  Plus,
  Loader2,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  // Fetch interview history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["interviews-history"],
    queryFn: async () => {
      const res = await api.get("/interviews/history");
      return res.data.data.interviews;
    },
  });

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Continue clearing local state regardless
    } finally {
      clearAuth();
      router.push("/");
    }
  };

  const pastInterviews = historyData || [];
  const completedInterviews = pastInterviews.filter(
    (i: { status: string }) => i.status === "completed",
  );

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen text-neutral-900">
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
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-neutral-800">{user?.name}</p>
              <p className="text-xs text-neutral-400 capitalize">
                {user?.role} Workspace
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white hover:bg-neutral-50 px-4 h-9 rounded-full transition-all duration-300 shadow-sm cursor-pointer font-bold"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-500" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto px-6 py-12 flex-1 w-full space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-[#F8FAF8] border border-neutral-200/80 rounded-[28px] relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="z-10">
            <h2 className="text-2xl font-black text-neutral-900">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-neutral-500 text-sm mt-2 max-w-xl leading-relaxed">
              Ready to practice? Launch a personalized interactive technical
              mock interview session evaluated live by our Grok system.
            </p>
          </div>

          <Link
            href="/dashboard/setup"
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full px-6 py-3.5 text-sm font-bold shadow-md shadow-green-500/15 hover:scale-[1.03] transition-all duration-300 h-12 cursor-pointer shrink-0 z-10"
          >
            <Plus className="w-4.5 h-4.5" />
            Start Mock Interview
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Total Sessions
              </p>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {pastInterviews.length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Completed Sessions
              </p>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {completedInterviews.length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Pending/Active
              </p>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {pastInterviews.length - completedInterviews.length}
              </p>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border border-neutral-200/80 shadow-sm rounded-[28px] p-8">
          <h3 className="text-lg font-extrabold text-neutral-900 mb-6">
            Your Interview Practice History
          </h3>

          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <p className="text-sm font-semibold">Fetching sessions list...</p>
            </div>
          ) : pastInterviews.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-200 rounded-[28px]">
              <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h4 className="text-neutral-800 font-bold">
                No interviews started yet
              </h4>
              <p className="text-neutral-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
                Create your first practice interview to experience real-time AI
                transcription, emotion overlay, and scoring report metrics.
              </p>
              <Link
                href="/dashboard/setup"
                className="mt-6 inline-flex items-center gap-2 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-xs font-bold px-6 py-3 rounded-full shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
              >
                Create New Session
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 font-bold">Role Path</th>
                    <th className="py-4 px-4 font-bold">Difficulty</th>
                    <th className="py-4 px-4 font-bold">Status</th>
                    <th className="py-4 px-4 font-bold">Created Date</th>
                    <th className="py-4 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {pastInterviews.map((interview: { id: string; role: string; difficulty: string; status: string; createdAt: string }) => (
                    <tr
                      key={interview.id}
                      className="hover:bg-[#F8FAF8]/60 transition-colors"
                    >
                      <td className="py-4 px-4 font-bold text-neutral-800">
                        {interview.role}
                      </td>
                      <td className="py-4 px-4 text-neutral-500 font-medium">
                        {interview.difficulty}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            interview.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700 animate-pulse"
                          }`}
                        >
                          {interview.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-neutral-400 font-medium">
                        {new Date(interview.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {interview.status === "completed" ? (
                          <Link
                            href={`/report/${interview.id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-extrabold transition-colors"
                          >
                            View Report
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/interview/${interview.id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-extrabold transition-colors"
                          >
                            Resume Session
                            <Play className="w-3 h-3 fill-amber-600 hover:fill-amber-700 text-amber-600" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
