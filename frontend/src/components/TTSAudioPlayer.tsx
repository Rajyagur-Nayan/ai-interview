"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";

interface TTSAudioPlayerProps {
  text: string;
  audioUrl?: string | null;
}

export default function TTSAudioPlayer({ text, audioUrl }: TTSAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Cancel any active speech on text or audio changes
    cleanupAudio();
    setUseFallback(!audioUrl);
  }, [text, audioUrl]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  const getBackendBaseUrl = () => {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    return apiURL.replace("/api/v1", "");
  };

  const playSpeech = () => {
    cleanupAudio();

    if (!useFallback && audioUrl) {
      setIsLoading(true);
      const host = getBackendBaseUrl();
      const fullUrl = `${host}${audioUrl}`;
      console.log(`[TTSAudioPlayer] Loading Piper neural audio file: ${fullUrl}`);

      const audio = new Audio(fullUrl);
      audioRef.current = audio;
      audio.muted = isMuted;

      audio.oncanplaythrough = () => {
        setIsLoading(false);
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn("[TTSAudioPlayer] Audio playback failed, triggering browser WebSpeech fallback:", err);
          triggerWebSpeechFallback();
        });
      };

      audio.onerror = () => {
        console.warn("[TTSAudioPlayer] Failed to load audio stream. Falling back to browser speech synthesis.");
        triggerWebSpeechFallback();
      };

      audio.onended = () => {
        setIsPlaying(false);
      };
    } else {
      triggerWebSpeechFallback();
    }
  };

  const triggerWebSpeechFallback = () => {
    if (!window.speechSynthesis) {
      console.error("[TTSAudioPlayer] Web Speech Synthesis not supported in this browser.");
      return;
    }
    setUseFallback(true);
    setIsLoading(false);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const defaultVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (defaultVoice) {
      utterance.voice = defaultVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (e) => {
      console.error("[TTSAudioPlayer] Web Speech synthesis error:", e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
  };

  const resumeSpeech = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      });
    } else if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    } else {
      playSpeech();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    // Web speech volume control
    if (window.speechSynthesis) {
      // If we are currently playing fallback, we can't mute mid-speech dynamically, but we can cancel and speak again with volume = 0
      if (useFallback && isPlaying) {
        window.speechSynthesis.cancel();
        if (!nextMuted) {
          playSpeech();
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 text-xs text-primary/70 bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-xl cursor-default"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading Audio...
        </button>
      ) : isPlaying ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={pauseSpeech}
            className="flex items-center gap-1.5 text-xs text-neutral-200 hover:text-white bg-primary hover:bg-primary/90 border border-primary px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow shadow-primary/20"
          >
            <Pause className="w-3.5 h-3.5 fill-white" />
            Pause Audio
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg bg-neutral-900 border border-neutral-850 cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-destructive" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={resumeSpeech}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-white transition-all bg-primary/5 hover:bg-primary/15 border border-primary/25 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-primary hover:fill-white" />
          {audioUrl ? "Play Question Audio" : "Synthesize Voice"}
        </button>
      )}
    </div>
  );
}
