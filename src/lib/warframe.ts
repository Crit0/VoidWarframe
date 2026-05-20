/* External Warframe API client (api.warframestat.us).
   All calls go through the server-side cache so the browser never hits
   the third-party API directly and the site stays fast + resilient. */

import { env } from "./env";
import { cached } from "./cache";

const BASE = env.WARFRAME_API_BASE;
const PLATFORM = env.WARFRAME_PLATFORM;
const TTL = env.WARFRAME_CACHE_TTL;

const MOD_FIELDS =
  "name,uniqueName,imageName,description,polarity,baseDrain,fusionLimit,type,rarity,compatName,isAugment,levelStats,wikiaUrl";
const ITEM_FIELDS = "name,uniqueName,imageName,category,description,wikiaUrl,tradable,type";

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export type CacheResult<T> = { data: T; source: "cache" | "live"; ageMs: number };

export function getWorldstate(lang = "ru"): Promise<CacheResult<unknown>> {
  return cached(`worldstate:${PLATFORM}:${lang}`, TTL, () =>
    fetchJson(`${BASE}/${PLATFORM}/?language=${lang}`),
  );
}

// Static-ish datasets get a long TTL (1 day).
const STATIC_TTL = 24 * 3600;

export function getMods(lang = "ru"): Promise<CacheResult<unknown[]>> {
  return cached(`mods:${lang}`, STATIC_TTL, () =>
    fetchJson<unknown[]>(`${BASE}/mods?language=${lang}&only=${MOD_FIELDS}`),
  );
}

export function getArcanes(lang = "ru"): Promise<CacheResult<unknown[]>> {
  return cached(`arcanes:${lang}`, STATIC_TTL, () =>
    fetchJson<unknown[]>(`${BASE}/arcanes?language=${lang}`),
  );
}

export function getItems(lang = "ru"): Promise<CacheResult<unknown[]>> {
  return cached(`items:${lang}`, STATIC_TTL, () =>
    fetchJson<unknown[]>(`${BASE}/items?language=${lang}&only=${ITEM_FIELDS}`),
  );
}
