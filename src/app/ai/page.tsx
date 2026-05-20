"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type Msg = { role: "user" | "assistant"; content: string };

export default function AiPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai")
      .then((r) => r.json())
      .then((j) => setEnabled(Boolean(j?.data?.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Ошибка запроса");
      setMessages([...next, { role: "assistant", content: json.data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col">
      <PageHeader title="AI-ассистент" subtitle="Помощь по билдам, фарму и механикам Warframe" />

      {enabled === false && (
        <div className="panel mb-4 border-neon-amber/40 p-4 text-sm text-neon-amber">
          AI-провайдер не настроен. Задайте переменные окружения{" "}
          <code className="font-mono">AI_PROVIDER</code> и{" "}
          <code className="font-mono">AI_API_KEY</code>.
        </div>
      )}

      <div className="panel flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-text-2">
            Спросите что-нибудь о Warframe — например, «Лучший билд на Сарину для Steel Path».
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "self-end bg-gold/15 text-text-0"
                    : "self-start bg-panel-light text-text-1"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && <div className="self-start text-xs text-text-2">AI печатает…</div>}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-neon-red">{error}</p>}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy || enabled === false}
          placeholder="Ваш вопрос…"
          className="flex-1 rounded-md border border-border bg-panel-light px-3 py-2 text-sm text-text-0 outline-none focus:border-border-gold disabled:opacity-50"
        />
        <button className="btn" onClick={send} disabled={busy || enabled === false}>
          Отправить
        </button>
      </div>
    </div>
  );
}
