"use client";

import { useEffect } from "react";
import { Mic, MicOff, Loader2, MicOff as MicBlocked } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceInputButton({ onTranscript, className }: VoiceInputButtonProps) {
  const {
    isRecording,
    isTranscribing,
    permissionState,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useSpeechRecognition();

  // When a transcript arrives, pass it up and clear internal state
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      clearTranscript();
    }
  }, [transcript, onTranscript, clearTranscript]);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Permission denied — show a helpful inline message instead of an alert
  if (permissionState === "denied") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <MicBlocked className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <span>
          Mic blocked.{" "}
          <button
            type="button"
            className="underline hover:no-underline"
            onClick={() => {
              // Open browser settings hint in a tooltip-style message
              window.open(
                "https://support.google.com/chrome/answer/2693767",
                "_blank",
                "noopener,noreferrer"
              );
            }}
          >
            How to allow it
          </button>{" "}
          — or just type your answer below.
        </span>
      </div>
    );
  }

  // Browser doesn't support any speech API
  if (permissionState === "unavailable") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTranscribing}
      title={isRecording ? "Tap to stop — we'll transcribe what you said" : "Tap to speak your answer"}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400",
        isRecording &&
          "animate-pulse border-red-300 bg-red-50 text-red-600 hover:bg-red-100",
        isTranscribing && "cursor-wait opacity-70",
        className
      )}
      aria-label={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isTranscribing ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : isRecording ? (
        <MicOff className="h-5 w-5" aria-hidden />
      ) : (
        <Mic className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
