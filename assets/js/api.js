import { CONFIG } from "./config.js";

function cacheKey(lang) {
  return `${CONFIG.CACHE_PREFIX}worldstate_${lang}`;
}

function readCache(lang) {
  try {
    const raw = sessionStorage.getItem(cacheKey(lang));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(lang, data) {
  try {
    sessionStorage.setItem(
      cacheKey(lang),
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {}
}

let inflightCtrl = null;

export async function getWorldstate(lang, { force = false } = {}) {
  const cached = readCache(lang);
  const fresh = cached && Date.now() - cached.ts < CONFIG.CACHE_TTL_MS;
  if (!force && fresh) {
    return { data: cached.data, stale: false };
  }

  if (inflightCtrl) inflightCtrl.abort();
  inflightCtrl = new AbortController();
  const signal = inflightCtrl.signal;

  const url = `${CONFIG.API_BASE}/${CONFIG.PLATFORM}/?language=${lang}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const data = await res.json();
    writeCache(lang, data);
    inflightCtrl = null;
    return { data, stale: false };
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.error("[VW] worldstate fetch failed:", url, (err && err.message) || String(err));
    if (cached) {
      return { data: cached.data, stale: true, error: err };
    }
    throw err;
  }
}
