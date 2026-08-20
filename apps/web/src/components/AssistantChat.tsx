"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How much do I owe so far?",
  "What deductions have you found?",
  "What documents am I missing?",
  "Explain my tax calculation",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi — I'm your Taxiva assistant. Ask me about your estimate, deductions, or missing documents." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerName, setProviderName] = useState<string | null>(null);

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
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong reaching the assistant." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex h-[32rem] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-ink-400">Thinking…</div>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-600 hover:bg-ink-50"
            type="button"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your taxes..."
        />
        <button type="submit" className="btn-primary" disabled={loading}>Send</button>
      </form>
      {providerName && (
        <p className="mt-2 text-center text-xs text-ink-400">
          Powered by: {providerName}{providerName === "mock-local-assistant" ? " (free, local, rule-based)" : ""}
        </p>
      )}
    </div>
  );
}
