"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Trash2, Play, Pause, CheckCircle2 } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onReset: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onReset }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Stop everything when component unmounts
  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    return () => {
      stopRecordingSession();
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, []);

  const stopRecordingSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    onReset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        onRecordingComplete(blob);
        stopRecordingSession();
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
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    onReset();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-[#F8FAF8] border border-neutral-200/80 shadow-sm p-6 rounded-[28px] flex flex-col items-center justify-center space-y-4 w-full max-w-md mx-auto">
      <div className="flex items-center gap-6">
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 hover:shadow-red-500/40 transition-all cursor-pointer animate-pulse"
          >
            <Square className="w-5 h-5 fill-white text-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center justify-center text-white shadow-md shadow-green-500/15 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Visualizer & Timer */}
      <div className="w-full flex flex-col items-center">
        {isRecording ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-end justify-center gap-1.5 h-8">
              <span className="w-1.5 bg-red-500 rounded animate-bounce [animation-duration:800ms] h-4" />
              <span className="w-1.5 bg-red-500 rounded animate-bounce [animation-duration:500ms] h-6" />
              <span className="w-1.5 bg-red-500 rounded animate-bounce [animation-duration:900ms] h-3" />
              <span className="w-1.5 bg-red-500 rounded animate-bounce [animation-duration:600ms] h-7" />
              <span className="w-1.5 bg-red-500 rounded animate-bounce [animation-duration:800ms] h-5" />
            </div>
            <div className="flex items-center gap-2 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Recording... {formatTime(recordingSeconds)}
              </span>
            </div>
          </div>
        ) : audioBlob ? (
          <div className="w-full flex flex-col items-center space-y-3">
            <span className="text-xs text-green-600 font-extrabold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Voice response captured
            </span>

            {/* Custom Audio Player Review Controls */}
            <div className="flex items-center gap-3 bg-white border border-neutral-200 px-4 py-2.5 rounded-full w-full justify-between shadow-sm">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-8 h-8 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-600 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-green-600 text-green-600" /> : <Play className="w-4 h-4 fill-green-600 text-green-600" />}
              </button>
              
              <div className="flex-1 px-4 text-xs text-neutral-500 font-bold select-none">
                Review Voice Answer Preview
              </div>

              <button
                type="button"
                onClick={deleteRecording}
                className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-all cursor-pointer"
                title="Discard Recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <audio
              ref={audioPlayerRef}
              src={audioUrl || ""}
              onEnded={handleAudioEnded}
              className="hidden"
            />
          </div>
        ) : (
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Click microphone to speak response</span>
        )}
      </div>
    </div>
  );
}
