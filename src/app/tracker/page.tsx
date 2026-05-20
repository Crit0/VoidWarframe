"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import type { Worldstate, WorldEvent, CycleState } from "@/types/warframe";

const REFRESH_MS = 30_000;

type ApiResponse = {
  ok: boolean;
  data?: { worldstate: Worldstate; source: string; ageMs: number };
  error?: string;
};

export default function TrackerPage() {
  const [ws, setWs] = useState<Worldstate | null>(null);
  const [source, setSource] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/worldstate?lang=ru", { cache: "no-store" });
      const json: ApiResponse = await res.json();
      if (!json.ok || !json.data) throw new Error(json.error ?? "Ошибка запроса");
      setWs(json.data.worldstate);
      setSource(json.data.source);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSource("offline");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const cycles: { label: string; cycle?: CycleState }[] = [
    { label: "Цетус", cycle: ws?.cetusCycle },
    { label: "Долина Сфер", cycle: ws?.vallisCycle },
    { label: "Деймос", cycle: ws?.cambionCycle },
    { label: "Земля", cycle: ws?.earthCycle },
  ];
  const alerts: WorldEvent[] = ws?.alerts ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Трекер"
        subtitle="Циклы и события Warframe — обновление каждые 30 секунд"
        right={
          <span className="chip">
            <span
              className={`h-2 w-2 rounded-full ${
                source === "live"
                  ? "bg-neon-green"
                  : source === "cache"
                    ? "bg-neon-amber"
                    : "bg-neon-red"
              }`}
            />
            {source === "live" ? "Live" : source === "cache" ? "Кэш" : source === "loading" ? "…" : "Offline"}
          </span>
        }
      />

      {error && (
        <div className="panel mb-6 border-neon-red/40 p-4 text-sm text-neon-red">{error}</div>
      )}

      <section className="mb-10">
        <h2 className="section-title mb-4">Циклы планет</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cycles.map(({ label, cycle }) => (
            <div key={label} className="panel p-4">
              <div className="font-display text-sm uppercase tracking-wider text-text-0">
                {label}
              </div>
              <div className="mt-2 text-2xl font-bold text-gold">
                {cycle?.state ?? (cycle?.isDay ? "День" : cycle?.isWarm ? "Тепло" : "—")}
              </div>
              <div className="mt-1 font-mono text-xs text-text-2">
                {cycle?.timeLeft ?? "нет данных"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-4">Тревоги</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-text-2">Активных тревог нет.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {alerts.map((a) => (
              <div key={a.id} className="panel p-4">
                <p className="text-sm text-text-0">{a.node ?? "Узел"}</p>
                <p className="mt-1 text-xs text-text-2">{a.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
