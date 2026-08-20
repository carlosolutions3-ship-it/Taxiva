"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { SparkleIcon, SendIcon, SpinnerIcon } from "./icons";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Did I miss anything?",
  "How much do I owe so far?",
  "What deductions have you found?",
  "Explain my tax calculation",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi — I'm your ${BRAND_NAME} assistant. Ask me about your estimate, deductions, missing documents, or try "did I miss anything?"`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerName, setProviderName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      setProviderName(data.providerName ?? null);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "Sorry, something went wrong." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong reaching the assistant. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex h-[34rem] flex-col !p-0 overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex animate-in ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <SparkleIcon className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 pl-8 text-xs text-ink-400">
            <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              type="button"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            className="input bg-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your taxes..."
          />
          <button type="submit" className="btn-primary shrink-0" disabled={loading || !input.trim()}>
            <SendIcon className="h-4 w-4" />
          </button>
        </form>
        {providerName && (
          <p className="mt-2 text-center text-[11px] text-ink-400">
            Powered by {providerName}
            {providerName === "mock-local-assistant" ? " — free, local, and grounded in your real data" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
