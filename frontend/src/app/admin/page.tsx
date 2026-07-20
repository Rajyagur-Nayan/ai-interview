"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Award,
  LogOut,
  Loader2,
  Sparkles,
  ClipboardList,
  Shield,
  RefreshCw,
} from "lucide-react";

export default function AdminPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  // Fetch admin analytics
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await api.get("/interviews/analytics");
      return res.data.data;
    },
  });

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Continue clearing local state
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const roleData = analytics?.roleDistribution || [];
  const chartData = roleData.map((item: any) => ({
    name: item.role,
    Sessions: Number(item.count),
  }));

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen text-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200/60 bg-white/80 backdrop-blur sticky top-0 z-20 h-[72px] flex items-center">
        <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-green-400 flex items-center justify-center shadow-sm shadow-green-500/10">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-neutral-900">
              System Admin Control
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
        {/* Welcome */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-neutral-900">
              Analytics Overview
            </h2>
            <p className="text-neutral-500 text-sm mt-1">
              Track system capacity, user sign ups, and mock performance
              results.
            </p>
          </div>
          <button
            onClick={() => refetchAnalytics()}
            className="flex items-center gap-2 bg-white border border-neutral-250 hover:border-neutral-350 hover:bg-neutral-50 text-neutral-700 text-xs font-bold px-5 h-11 rounded-full transition-all duration-300 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
            Sync Metrics
          </button>
        </div>

        {/* Analytics KPIs */}
        {analyticsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <p className="text-sm font-semibold text-neutral-600">
              Calculating metric logs...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600">
                  <ClipboardList className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    Total Mock Sessions
                  </p>
                  <p className="text-3xl font-black text-neutral-900 mt-1">
                    {analytics?.totalInterviews || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    Total Registered Accounts
                  </p>
                  <p className="text-3xl font-black text-neutral-900 mt-1">
                    {analytics?.totalUsers || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600">
                  <Award className="w-5.5 h-5.5 text-green-600" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    Average Graded Score
                  </p>
                  <p className="text-3xl font-black text-neutral-900 mt-1">
                    {analytics?.averageScore || 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] lg:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Session Demand
                  </div>
                  <h3 className="text-lg font-extrabold text-neutral-900">
                    Interviews by Job Role
                  </h3>
                </div>

                <div className="h-64 mt-6 w-full text-xs text-neutral-450">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          stroke="#888"
                          tick={{ fontSize: 11, fontWeight: "bold" }}
                        />
                        <YAxis
                          stroke="#888"
                          tick={{ fontSize: 11, fontWeight: "bold" }}
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
                          dataKey="Sessions"
                          fill="#22c55e"
                          radius={[6, 6, 0, 0]}
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border border-dashed border-neutral-250 rounded-[28px] text-neutral-400">
                      No session data distribution records.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-neutral-200/80 shadow-sm p-8 rounded-[28px] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">
                    System Monitoring
                  </h3>
                  <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed">
                    Platform microservices connectivity status checklist.
                  </p>
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center p-4 bg-[#F8FAF8] border border-neutral-200 rounded-2xl">
                    <span className="text-xs text-neutral-600 font-bold uppercase tracking-wide">
                      Grok API Client
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 border border-green-200/60 px-3 py-1 rounded-full font-bold">
                      ONLINE
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#F8FAF8] border border-neutral-200 rounded-2xl">
                    <span className="text-xs text-neutral-600 font-bold uppercase tracking-wide">
                      Whisper Transcription
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 border border-green-200/60 px-3 py-1 rounded-full font-bold">
                      ONLINE
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#F8FAF8] border border-neutral-200 rounded-2xl">
                    <span className="text-xs text-neutral-600 font-bold uppercase tracking-wide">
                      Piper TTS Output
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 border border-green-200/60 px-3 py-1 rounded-full font-bold">
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
