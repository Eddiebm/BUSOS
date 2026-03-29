"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { StressMode } from "@/hooks/useVenture";

interface AdaMessageProps {
  ventureId: string;
  mode: StressMode;
}

interface AdaResponse {
  text: string;
  tone: string;
  suggestions?: Array<{ label: string; action: string }>;
}

interface ChatMessage {
  role: "user" | "ada";
  text: string;
}

export function AdaMessage({ ventureId, mode }: AdaMessageProps) {
  const [data, setData] = useState<AdaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ventures/${ventureId}/ada`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ventureId]);

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || chatLoading) return;
    setInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
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
        { role: "ada", text: json.reply ?? "Sorry, I couldn't process that." },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ada", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  }

  const toneColor =
    data?.tone === "urgent"
      ? "border-red-300 bg-red-50"
      : data?.tone === "direct"
      ? "border-blue-200 bg-blue-50"
      : "border-slate-200 bg-white";

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneColor}`}>
      <h3 className="font-semibold text-slate-900">Ada</h3>

      {/* Proactive message */}
      {loading && <p className="mt-2 text-sm text-slate-500">Thinking…</p>}
      {!loading && data?.text && (
        <>
          <p className="mt-2 text-sm text-slate-700">{data.text}</p>
          {data.suggestions && data.suggestions.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.suggestions.map((s, i) => (
                <li key={i}>
                  <Link
                    href={s.action}
                    className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {!loading && !data?.text && (
        <p className="mt-2 text-sm text-slate-500">Ask me anything about your venture.</p>
      )}

      {/* Chat history */}
      {chatMessages.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
          {chatMessages.map((m, i) => (
            <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
              <span
                className={`inline-block rounded-lg px-3 py-1.5 ${
                  m.role === "user"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
          {chatLoading && (
            <p className="text-left text-xs text-slate-400 italic">Ada is thinking…</p>
          )}
        </div>
      )}

      {/* Chat input */}
      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Ada anything…"
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          disabled={chatLoading}
        />
        <button
          onClick={sendMessage}
          disabled={chatLoading || !input.trim()}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
