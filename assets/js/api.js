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
const refreshDebounce = new Map();

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
    return { data, url };
  } catch (err) {
    if (err.name === "AbortError") throw err;
    console.error("[VW] worldstate fetch failed:", url, (err && err.message) || String(err));
    throw err;
  }
}

function refreshInBackground(lang) {
  const last = refreshDebounce.get(lang) || 0;
  if (Date.now() - last < 60 * 1000) return;
  refreshDebounce.set(lang, Date.now());
  fetchFromApi(lang)
    .then(({ data }) => {
      writeCache(lang, data);
      CacheBus.dispatchEvent(new CustomEvent("worldstate-updated", { detail: { lang, source: "api" } }));
    })
    .catch(() => { /* swallowed in fetchFromApi */ });
}

export async function getWorldstate(lang, { force = false } = {}) {
  const cached = readCache(lang);
  const cacheAge = cached ? Date.now() - cached.ts : Infinity;
  const fresh = cached && cacheAge < CONFIG.CACHE_TTL_MS;

  if (!force && fresh) {
    return { data: cached.data, stale: false, source: "session", ageMs: cacheAge };
  }

  // If we have a stale session cache, return it instantly + refresh in background.
  if (!force && cached) {
    refreshInBackground(lang);
    return { data: cached.data, stale: true, source: "session", ageMs: cacheAge };
  }

  // No session cache → race bundle vs API.
  const bundleP = loadBundle("worldstate", lang);
  const apiP = fetchFromApi(lang).then((r) => r).catch(() => null);

  const winner = await Promise.race([
    bundleP.then((b) => (b && typeof b === "object") ? { data: b, source: "bundle" } : null),
    apiP.then((r) => r ? { data: r.data, source: "api" } : null),
  ]);

  if (winner && winner.source === "api") {
    writeCache(lang, winner.data);
    return { data: winner.data, stale: false, source: "api", ageMs: 0 };
  }

  if (winner && winner.source === "bundle") {
    const ageMs = await bundleAgeMs("worldstate", lang);
    // Continue waiting for API in background.
    apiP.then((r) => {
      if (r) {
        writeCache(lang, r.data);
        CacheBus.dispatchEvent(new CustomEvent("worldstate-updated", { detail: { lang, source: "api" } }));
      }
    });
    return { data: winner.data, stale: true, source: "bundle", ageMs };
  }

  // Neither bundle nor API came back; wait for whichever resolves second.
  const apiRes = await apiP;
  if (apiRes) {
    writeCache(lang, apiRes.data);
    return { data: apiRes.data, stale: false, source: "api", ageMs: 0 };
  }
  const bundleRes = await bundleP;
  if (bundleRes) {
    const ageMs = await bundleAgeMs("worldstate", lang);
    return { data: bundleRes, stale: true, source: "bundle", ageMs };
  }

  if (cached) return { data: cached.data, stale: true, source: "session-old", ageMs: cacheAge };
  throw new Error("No data available");
}
