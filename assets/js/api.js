import { CONFIG } from "./config.js";
import { loadBundle, bundleAgeMs } from "./bundle.js";
import { CacheBus } from "./cache-bus.js";

function cacheKey(lang) { return `${CONFIG.CACHE_PREFIX}worldstate_${lang}`; }

function readCache(lang) {
  try {
    const raw = sessionStorage.getItem(cacheKey(lang));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeCache(lang, data) {
  try { sessionStorage.setItem(cacheKey(lang), JSON.stringify({ data, ts: Date.now() })); } catch {}
}

let inflightCtrl = null;

async function fetchFromApi(lang) {
  if (inflightCtrl) inflightCtrl.abort();
  inflightCtrl = new AbortController();
  const signal = inflightCtrl.signal;
  const url = `${CONFIG.API_BASE}/${CONFIG.PLATFORM}/?language=${lang}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    inflightCtrl = null;
    return data;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn("[VW] worldstate fetch failed:", url, (err && err.message) || String(err));
    }
    throw err;
  }
}

export async function getWorldstate(lang, { force = false } = {}) {
  const cached = readCache(lang);
  const cacheAge = cached ? Date.now() - cached.ts : Infinity;
  const fresh = cached && cacheAge < CONFIG.CACHE_TTL_MS;

  if (!force && fresh) {
    return { data: cached.data, stale: false, source: "session", ageMs: cacheAge };
  }

  // API first.
  try {
    const data = await fetchFromApi(lang);
    writeCache(lang, data);
    return { data, stale: false, source: "api", ageMs: 0 };
  } catch (err) {
    if (err.name === "AbortError") throw err;
    CacheBus.dispatchEvent(new CustomEvent("worldstate-failed", { detail: { lang } }));
    // Fallback 1: stale session cache.
    if (cached) {
      return { data: cached.data, stale: true, source: "session-old", ageMs: cacheAge };
    }
    // Fallback 2: bundle.
    const bundle = await loadBundle("worldstate", lang);
    if (bundle) {
      const ageMs = await bundleAgeMs("worldstate", lang);
      return { data: bundle, stale: true, source: "bundle", ageMs };
    }
    throw err;
  }
}
