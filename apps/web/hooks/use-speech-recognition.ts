"use client";

import { useCallback, useRef, useState } from "react";

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
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
      .catch((err) => {
        console.error("Error accessing microphone:", err);
        alert("Microphone access denied. Please enable it in your browser settings.");
      });
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);
        resolve(audioBlob);
      };

      recorder.stop();
    });
  }, []);

  return { isRecording, startRecording, stopRecording };
}
