"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  permissionState: PermissionState;
  transcript: string;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
}

// Extend Window to include webkit prefixed SpeechRecognition
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("idle");
  const [transcript, setTranscript] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const useWebSpeechRef = useRef<boolean>(false);

  // Detect which API to use on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    useWebSpeechRef.current = !!SpeechRecognitionAPI;
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      // Use Web Speech API — no server round-trip, no explicit mic permission dialog
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        setPermissionState("granted");
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          }
        }
        if (finalText) {
          setTranscript((prev) => (prev ? prev + " " + finalText : finalText));
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setPermissionState("denied");
        } else if (event.error === "no-speech") {
          // Silently handle — user just didn't speak
          setPermissionState("granted");
        } else {
          setPermissionState("unavailable");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      setPermissionState("requesting");
      recognition.start();
    } else if (navigator.mediaDevices?.getUserMedia) {
      // Fallback: MediaRecorder + server-side transcription
      setPermissionState("requesting");
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setPermissionState("granted");
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };
          mediaRecorder.start();
          setIsRecording(true);
        })
        .catch(() => {
          setPermissionState("denied");
        });
    } else {
      setPermissionState("unavailable");
    }
  }, []);

  const stopRecording = useCallback(() => {
    // Stop Web Speech API
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      return;
    }

    // Stop MediaRecorder fallback
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      recorder.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);

      if (audioBlob.size > 0) {
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            const result = (await response.json()) as { text?: string };
            const text = typeof result.text === "string" ? result.text.trim() : "";
            if (text) {
              setTranscript((prev) => (prev ? prev + " " + text : text));
            }
          }
        } catch {
          // Silently fail — user can type instead
        } finally {
          setIsTranscribing(false);
        }
      }
    };

    recorder.stop();
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isRecording,
    isTranscribing,
    permissionState,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
