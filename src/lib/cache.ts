/* Server-side cache for external API responses, backed by the ApiCache
   table. Falls back gracefully to a direct fetch if the DB is unreachable,
   so the site keeps working even without a database. */

import { prisma } from "./prisma";

type Fetcher<T> = () => Promise<T>;

/**
 * Return cached payload for `key` if still fresh; otherwise run `fetcher`,
 * store the result with a TTL, and return it.
 *
 * On any DB error this degrades to calling `fetcher` directly.
 */
export async function cached<T>(key: string, ttlSeconds: number, fetcher: Fetcher<T>): Promise<{
  data: T;
  source: "cache" | "live";
  ageMs: number;
}> {
  // 1) Try fresh cache row.
  try {
    const row = await prisma.apiCache.findUnique({ where: { key } });
    if (row && row.expiresAt.getTime() > Date.now()) {
      return {
        data: row.payload as T,
        source: "cache",
        ageMs: Date.now() - row.fetchedAt.getTime(),
      };
    }
  } catch {
    // DB unavailable — skip straight to live fetch.
  }

  // 2) Live fetch.
  let data: T;
  try {
    data = await fetcher();
  } catch (err) {
    // 3) Live failed — serve a stale row if one exists.
    try {
      const stale = await prisma.apiCache.findUnique({ where: { key } });
      if (stale) {
        return {
          data: stale.payload as T,
          source: "cache",
          ageMs: Date.now() - stale.fetchedAt.getTime(),
        };
      }
    } catch {
      /* ignore */
    }
    throw err;
  }

  // 4) Store fresh result (best-effort).
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    await prisma.apiCache.upsert({
      where: { key },
      update: { payload: data as object, fetchedAt: now, expiresAt },
      create: { key, payload: data as object, fetchedAt: now, expiresAt },
    });
  } catch {
    /* cache write is best-effort */
  }

  return { data, source: "live", ageMs: 0 };
}
