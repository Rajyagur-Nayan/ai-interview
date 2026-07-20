"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Mail, Sparkles, Loader2, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", data);
      const { accessToken, user } = response.data.data;
      setAuth(accessToken, user);
      
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden bg-gradient-to-b from-[#F8FAF8] via-white to-white text-neutral-900">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-bold mb-4 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered evaluation system
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">
            AI Interviewer
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            Log in to access your interview workspace
          </p>
        </div>

        <div className="bg-white border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 rounded-[28px]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-400">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  className="w-full h-12 bg-white border border-neutral-200 rounded-full pl-11 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors duration-200"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-2 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-400">
                  <KeyRound className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full h-12 bg-white border border-neutral-200 rounded-full pl-11 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors duration-200"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-2 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full py-2.5 text-sm font-bold shadow-md shadow-green-500/15 hover:scale-[1.03] transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-8">
          Don't have an account?{" "}
          <Link href="/register" className="text-green-500 hover:underline font-bold transition-colors">
            Register for free
          </Link>
        </p>
      </div>
    </div>
  );
}
