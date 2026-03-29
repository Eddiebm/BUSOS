"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StressMode } from "@/types/api";

interface AdaResponse {
  text: string;
  message?: string;
  reasoning?: string[];
  tone: "urgent" | "direct" | "encouraging";
  suggestions?: Array<{ label: string; action: string }>;
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string[];
}

interface AdaMessageProps {
  ventureId: string;
  mode: StressMode;
}

function ReasoningBlock({
  reasoning,
  open,
  onToggle,
}: {
  reasoning: string[];
  open: boolean;
  onToggle: () => void;
}) {
  if (reasoning.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Why this recommendation{" "}
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
      {open && (
        <div className="mt-2 rounded-md bg-muted p-3 text-sm text-foreground">
          <ul className="list-disc space-y-1 pl-4">
            {reasoning.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AdaMessage({ ventureId, mode }: AdaMessageProps) {
  const [proactive, setProactive] = useState<AdaResponse | null>(null);
  const [proactiveLoading, setProactiveLoading] = useState(true);
  const [proactiveReasonOpen, setProactiveReasonOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [openReasoningKey, setOpenReasoningKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProactiveLoading(true);
    fetch(`/api/ventures/${ventureId}/ada`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AdaResponse | null) => {
        if (data) {
          const text = data.message ?? data.text ?? "";
          setProactive({ ...data, text });
        } else setProactive(null);
      })
      .catch(() => setProactive(null))
      .finally(() => setProactiveLoading(false));
  }, [ventureId]);

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
      const json = (await r.json()) as {
        reply?: string;
        message?: string;
        reasoning?: string[];
      };
      const reply = json.message ?? json.reply ?? "Sorry, I couldn't process that.";
      const reasoning = Array.isArray(json.reasoning) ? json.reasoning : [];
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          reasoning,
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
      border: "border-destructive/45",
      header: "bg-destructive/15 border-destructive/40",
      dot: "bg-destructive",
      pill: "bg-destructive/15 text-destructive hover:bg-destructive/25",
      btn: "bg-destructive hover:bg-destructive/90",
    },
    EXECUTION: {
      border: "border-info/35",
      header: "bg-info/15 border-info/35",
      dot: "bg-info",
      pill: "bg-info/15 text-info hover:bg-info/25",
      btn: "bg-info hover:bg-info/90",
    },
    DISCOVERY: {
      border: "border-primary/35",
      header: "bg-primary/12 border-primary/35",
      dot: "bg-primary",
      pill: "bg-primary/12 text-primary hover:bg-primary/20",
      btn: "bg-primary hover:bg-primary/90",
    },
  }[mode] ?? {
    border: "border-border",
    header: "bg-muted border-border",
    dot: "bg-muted-foreground",
    pill: "bg-muted text-foreground hover:bg-muted",
    btn: "bg-foreground hover:bg-muted",
  };

  const proactiveReasoning = proactive?.reasoning ?? [];

  return (
    <div className={cn("rounded-xl border shadow-sm overflow-hidden", accent.border)}>
      <div className={cn("px-4 py-3 border-b flex items-center gap-2", accent.header)}>
        <span className={cn("h-2 w-2 rounded-full animate-pulse", accent.dot)} />
        <span className="text-sm font-semibold text-foreground">Ada</span>
        <span className="ml-auto text-xs text-muted-foreground capitalize">
          {mode.toLowerCase()} mode
        </span>
      </div>

      <div className="bg-card px-4 py-4 border-b border-border">
        {proactiveLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        ) : proactive?.text ? (
          <>
            <p className="text-sm leading-relaxed text-foreground">{proactive.text}</p>
            <ReasoningBlock
              reasoning={proactiveReasoning}
              open={proactiveReasonOpen}
              onToggle={() => setProactiveReasonOpen((v) => !v)}
            />
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
          <p className="text-sm text-muted-foreground italic">Ask me anything about your venture.</p>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto bg-card px-4 py-3 space-y-3">
        {historyLoaded && chatMessages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-2">
            Your conversation with Ada will appear here and persist across sessions.
          </p>
        )}
        {chatMessages.map((m, i) => {
          const key = m.id ?? `chat-${i}`;
          const isAssistant = m.role === "assistant";
          const reasoning = m.reasoning ?? [];
          return (
            <div
              key={key}
              className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-foreground text-background rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {m.content}
              </div>
              {isAssistant && reasoning.length > 0 && (
                <div className="max-w-[85%] pl-0 pt-1">
                  <ReasoningBlock
                    reasoning={reasoning}
                    open={openReasoningKey === key}
                    onToggle={() =>
                      setOpenReasoningKey((k) => (k === key ? null : key))
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask Ada anything about your venture…"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-border"
            disabled={chatLoading}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={chatLoading || !input.trim()}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition-colors disabled:opacity-40",
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
