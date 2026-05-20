/* Home — server component. Pulls live worldstate through the cached
   Warframe client and renders news + active events. */

import Link from "next/link";
import { getWorldstate } from "@/lib/warframe";
import { PageHeader } from "@/components/PageHeader";
import type { Worldstate, NewsItem, WorldEvent } from "@/types/warframe";

export const dynamic = "force-dynamic";

async function loadWorldstate(): Promise<{
  ws: Worldstate | null;
  source: string;
  error?: string;
}> {
  try {
    const { data, source } = await getWorldstate("ru");
    return { ws: data as Worldstate, source };
  } catch (err) {
    return { ws: null, source: "none", error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function HomePage() {
  const { ws, source, error } = await loadWorldstate();
  const news: NewsItem[] = (ws?.news ?? []).slice(0, 6);
  const events: WorldEvent[] = (ws?.events ?? []).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Voide Warframe"
        subtitle="Full-stack платформа сообщества Tenno"
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
            {source === "live" ? "API Live" : source === "cache" ? "Кэш" : "Offline"}
          </span>
        }
      />

      {error && (
        <div className="panel mb-6 border-neon-red/40 p-4 text-sm text-neon-red">
          Не удалось получить данные Warframe API: {error}
        </div>
      )}

      <section className="mb-10">
        <h2 className="section-title mb-4">Новости</h2>
        {news.length === 0 ? (
          <p className="text-sm text-text-2">Новостей пока нет.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="panel group flex flex-col overflow-hidden transition-colors hover:border-border-gold"
              >
                {n.imageLink && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={n.imageLink}
                    alt=""
                    className="h-36 w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex-1 text-sm text-text-1">{n.message}</p>
                  <span className="mt-3 font-mono text-[0.65rem] text-text-2">
                    {new Date(n.date).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="section-title mb-4">Активные события</h2>
        {events.length === 0 ? (
          <p className="text-sm text-text-2">Активных событий нет.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((e) => (
              <div key={e.id} className="panel p-4">
                <p className="text-sm text-text-0">{e.description ?? "Событие"}</p>
                {e.node && <p className="mt-1 text-xs text-text-2">{e.node}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link href="/tracker" className="panel-gold p-5 transition-colors hover:bg-panel-light">
          <h3 className="mb-1 text-base">Трекер</h3>
          <p className="text-xs text-text-2">Циклы, алерты и события в реальном времени.</p>
        </Link>
        <Link href="/inventory" className="panel-gold p-5 transition-colors hover:bg-panel-light">
          <h3 className="mb-1 text-base">Инвентарь</h3>
          <p className="text-xs text-text-2">Каталог модов с фильтрами и поиском.</p>
        </Link>
        <Link href="/ai" className="panel-gold p-5 transition-colors hover:bg-panel-light">
          <h3 className="mb-1 text-base">AI-ассистент</h3>
          <p className="text-xs text-text-2">Помощь по билдам, фарму и механикам.</p>
        </Link>
      </section>
    </div>
  );
}
