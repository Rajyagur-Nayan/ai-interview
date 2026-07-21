"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  AudioLines,
  Award,
  Play,
  Cpu,
  HeartPulse,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-b from-[#F8FAF8] via-white to-white text-neutral-900 pt-28">
      {/* Decorative premium glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Modern floating navbar */}
      <div className="w-full fixed top-6 left-0 right-0 z-50 px-4 md:px-6 no-print">
        <header className="max-w-[1280px] mx-auto h-[72px] rounded-full bg-white/85 backdrop-blur-md border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-between px-6 md:px-8 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-green-400 flex items-center justify-center shadow-sm shadow-green-500/10">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
              AI Interviewer
            </span>
          </div>

          {/* Centered navigation items */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-sm font-semibold text-neutral-900 relative after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-green-500 after:rounded-full"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#technology"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Technology
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors px-3 py-2 rounded-full hover:bg-neutral-100/50"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-bold px-5 py-3 rounded-full shadow-sm shadow-green-500/15 hover:scale-[1.03] transition-all duration-300 flex items-center h-10"
            >
              Register Free
            </Link>
          </div>
        </header>
      </div>

      {/* Hero */}
      <section className="max-w-[1280px] mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center z-10 relative flex-1 justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-bold mb-8 tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Production-grade AI Testing Suite
        </div>

        <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-600 bg-clip-text text-transparent">
          Conduct Real-Time AI Interviews <br />
          <span className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 bg-clip-text text-transparent text-glow">
            With Speech & Emotion Intelligence
          </span>
        </h1>

        <p className="text-neutral-500 text-base md:text-lg max-w-[650px] mt-8 leading-relaxed mx-auto">
          Elevate your evaluation pipeline using advanced Grok LLM intelligence,
          Whisper transcription, Piper Text-to-Speech vocal agents, and
          client-side face emotion analysis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full px-8 py-3.5 text-sm font-bold shadow-md shadow-green-500/20 hover:scale-[1.03] transition-all duration-300 h-12 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            Start Demo Interview
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 rounded-full px-8 py-3.5 text-sm font-bold shadow-sm hover:shadow transition-all duration-300 h-12 cursor-pointer"
          >
            View Candidate Dashboard
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div
          id="features"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[1024px] mt-32"
        >
          <div className="bg-white p-8 rounded-[28px] border border-neutral-200/80 text-left hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-11 h-11 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
              <AudioLines className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              Voice-Based AI Agent
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Interact verbally using standard microphone recording, Whisper
              speech-to-text transcribing, and custom verbal prompts.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[28px] border border-neutral-200/80 text-left hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-11 h-11 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
              <HeartPulse className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              Real-Time Emotion Tracking
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Leverage client-side face-api.js model scripts to capture
              emotional expressions (neutral, focused, happy, nervous)
              dynamically.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[28px] border border-neutral-200/80 text-left hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
            <div className="w-11 h-11 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
              <Award className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              Grok LLM Evaluator
            </h3>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Receive automated, detailed grading reports, transcripts, core
              strengths, and structural feedback generated by Grok.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/60 py-10 z-10 bg-[#F8FAF8]">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-neutral-500 text-xs">
          <p>© 2026 AI Interviewer Platform. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-neutral-900 transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-neutral-900 transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-neutral-900 transition-colors cursor-pointer">
              System Health
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
