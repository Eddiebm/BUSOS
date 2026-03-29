"use client";

import { useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceInputButton({ onTranscript, className }: VoiceInputButtonProps) {
  const { isRecording, startRecording, stopRecording } = useSpeechRecognition();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob && audioBlob.size > 0) {
        setIsTranscribing(true);
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            const result = (await response.json()) as { text?: string };
            const text = typeof result.text === "string" ? result.text : "";
            if (text.trim()) onTranscript(text);
          } else {
            console.error("Transcription failed");
            alert("Sorry, we couldn't transcribe that. Please try again.");
          }
        } catch (error) {
          console.error("Error during transcription:", error);
          alert("An error occurred. Please check your connection and try again.");
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      startRecording();
    }
  };

  const Icon = isRecording ? MicOff : Mic;

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      disabled={isTranscribing}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50",
        isRecording && "border-red-200 bg-red-100 text-red-600 hover:bg-red-200",
        className
      )}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isTranscribing ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
