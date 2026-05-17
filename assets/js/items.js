import { CONFIG } from "./config.js";

/* Items dictionary: lookup table for localised name + CDN icon.
   One bulk fetch per language, cached in localStorage for 7 days. */

const VERSION = 1;
const memCache = new Map();      // lang → built dict
let inflight = new Map();        // lang → Promise

function cacheKey(lang) { return `vw_items_${lang}_v${VERSION}`; }

function readCache(lang) {
  try {
    const raw = localStorage.getItem(cacheKey(lang));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG.ITEMS_TTL_MS) return null;
    return data;
  } catch { return null; }
}

function writeCache(lang, data) {
  try {
    localStorage.setItem(cacheKey(lang), JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {
    console.warn("[VW] items cache write failed (quota?):", e.message);
  }
}

function buildIndex(arr) {
  const byUnique = new Map();
  const byName = new Map();
  for (const it of arr) {
    if (!it) continue;
    if (it.uniqueName) byUnique.set(it.uniqueName, it);
    if (it.name) byName.set(it.name.toLowerCase(), it);
  }
  return {
    size: arr.length,
    byUnique, byName,
    lookup(query) {
      if (!query) return null;
      if (typeof query === "object") {
        if (query.uniqueName && byUnique.has(query.uniqueName)) return byUnique.get(query.uniqueName);
        const name = (query.item || query.name || "").toLowerCase();
        return byName.get(name) || null;
      }
      return byUnique.get(query) || byName.get(String(query).toLowerCase()) || null;
    },
  };
}

export async function getItemsDict(lang) {
  if (memCache.has(lang)) return memCache.get(lang);
  if (inflight.has(lang)) return inflight.get(lang);

  const cached = readCache(lang);
  if (cached) {
    const dict = buildIndex(cached);
    memCache.set(lang, dict);
    return dict;
  }

  const url = `${CONFIG.API_BASE}/items?language=${lang}&only=name,uniqueName,imageName`;
  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      writeCache(lang, arr);
      const dict = buildIndex(arr);
      memCache.set(lang, dict);
      return dict;
    } catch (err) {
      console.warn("[VW] items dict fetch failed:", err);
      const empty = buildIndex([]);
      memCache.set(lang, empty);
      return empty;
    } finally {
      inflight.delete(lang);
    }
  })();
  inflight.set(lang, p);
  return p;
}

export function itemImageUrl(itemEntry) {
  if (!itemEntry) return null;
  const name = itemEntry.imageName;
  if (!name) return null;
  return `${CONFIG.CDN_IMG}${name}`;
}

export function resolveItem(rowOrName, dict) {
  if (!dict) return null;
  return dict.lookup(rowOrName);
}
