"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { StressMode } from "@/types/api";

interface AdaResponse {
  text: string;
  tone: "urgent" | "direct" | "encouraging";
  suggestions?: Array<{ label: string; action: string }>;
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface AdaMessageProps {
  ventureId: string;
  mode: StressMode;
}

export function AdaMessage({ ventureId, mode }: AdaMessageProps) {
  const [proactive, setProactive] = useState<AdaResponse | null>(null);
  const [proactiveLoading, setProactiveLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load proactive message
  useEffect(() => {
    setProactiveLoading(true);
    fetch(`/api/ventures/${ventureId}/ada`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setProactive)
      .catch(() => setProactive(null))
      .finally(() => setProactiveLoading(false));
  }, [ventureId]);

  // Load persistent chat history
  useEffect(() => {
    fetch(`/api/ventures/${ventureId}/ada`, { method: "PATCH" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.messages) {
          setChatMessages(
            data.messages.map((m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [ventureId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (historyLoaded && chatMessages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, historyLoaded]);

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || chatLoading) return;
    setInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const r = await fetch(`/api/ventures/${ventureId}/ada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const json = await r.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json.reply ?? "Sorry, I couldn't process that.",
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  }

  const accent = {
    SURVIVAL: {
      border: "border-red-300",
      header: "bg-red-100 border-red-200",
      dot: "bg-red-500",
      pill: "bg-red-100 text-red-800 hover:bg-red-200",
      btn: "bg-red-600 hover:bg-red-700",
    },
    EXECUTION: {
      border: "border-blue-200",
      header: "bg-blue-100 border-blue-200",
      dot: "bg-blue-600",
      pill: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    DISCOVERY: {
      border: "border-indigo-200",
      header: "bg-indigo-100 border-indigo-200",
      dot: "bg-indigo-600",
      pill: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
      btn: "bg-indigo-600 hover:bg-indigo-700",
    },
  }[mode] ?? {
    border: "border-slate-200",
    header: "bg-slate-100 border-slate-200",
    dot: "bg-slate-500",
    pill: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    btn: "bg-slate-800 hover:bg-slate-700",
  };

  return (
    <div className={cn("rounded-xl border shadow-sm overflow-hidden", accent.border)}>
      {/* Header */}
      <div className={cn("px-4 py-3 border-b flex items-center gap-2", accent.header)}>
        <span className={cn("h-2 w-2 rounded-full animate-pulse", accent.dot)} />
        <span className="text-sm font-semibold text-slate-900">Ada — AI Co-founder</span>
        <span className="ml-auto text-xs text-slate-500 capitalize">
          {mode.toLowerCase()} mode
        </span>
      </div>

      {/* Proactive message */}
      <div className="bg-white px-4 py-4 border-b border-slate-100">
        {proactiveLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        ) : proactive?.text ? (
          <>
            <p className="text-sm leading-relaxed text-slate-700">{proactive.text}</p>
            {proactive.suggestions && proactive.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {proactive.suggestions.map((s, i) => (
                  <Link
                    key={i}
                    href={s.action}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      accent.pill
                    )}
                  >
                    {s.label} →
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Ask me anything about your venture.
          </p>
        )}
      </div>

      {/* Chat history */}
      <div className="max-h-72 overflow-y-auto bg-white px-4 py-3 space-y-3">
        {historyLoaded && chatMessages.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-2">
            Your conversation with Ada will appear here and persist across sessions.
          </p>
        )}
        {chatMessages.map((m, i) => (
          <div
            key={m.id ?? i}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-slate-800 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white px-4 py-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask Ada anything about your venture…"
            className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={chatLoading}
          />
          <button
            onClick={sendMessage}
            disabled={chatLoading || !input.trim()}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-40",
              accent.btn
            )}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
