"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import type { ModEntry } from "@/types/warframe";

type ApiResponse = {
  ok: boolean;
  data?: { mods: ModEntry[]; count: number; source: string };
  error?: string;
};

const PAGE_SIZE = 48;

export default function InventoryPage() {
  const [mods, setMods] = useState<ModEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/mods?lang=ru", { cache: "no-store" });
        const json: ApiResponse = await res.json();
        if (!json.ok || !json.data) throw new Error(json.error ?? "Ошибка запроса");
        if (active) setMods(json.data.mods);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mods.filter((m) => {
      if (rarity !== "all" && (m.rarity ?? "").toLowerCase() !== rarity) return false;
      if (q && !(m.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mods, query, rarity]);

  const visible = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Инвентарь модов"
        subtitle={loading ? "Загрузка…" : `${filtered.length} модов`}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Поиск модов…"
          className="flex-1 rounded-md border border-border bg-panel-light px-3 py-2 text-sm text-text-0 outline-none focus:border-border-gold"
        />
        <select
          value={rarity}
          onChange={(e) => {
            setRarity(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-border bg-panel-light px-3 py-2 text-sm text-text-1 outline-none focus:border-border-gold"
        >
          <option value="all">Любая редкость</option>
          <option value="common">Обычный</option>
          <option value="uncommon">Необычный</option>
          <option value="rare">Редкий</option>
          <option value="legendary">Легендарный</option>
        </select>
      </div>

      {error && (
        <div className="panel mb-6 border-neon-red/40 p-4 text-sm text-neon-red">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="panel h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((m) => (
              <div key={m.uniqueName} className="panel flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm text-text-0">{m.name}</h3>
                  {m.rarity && <span className="chip shrink-0">{m.rarity}</span>}
                </div>
                {m.description && (
                  <p className="mt-2 line-clamp-3 text-xs text-text-2">{m.description}</p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-3 font-mono text-[0.65rem] text-text-2">
                  {m.polarity && <span>{m.polarity}</span>}
                  {m.compatName && <span>· {m.compatName}</span>}
                </div>
              </div>
            ))}
          </div>

          {visible.length < filtered.length && (
            <div className="mt-6 text-center">
              <button className="btn" onClick={() => setPage((p) => p + 1)}>
                Показать ещё
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
