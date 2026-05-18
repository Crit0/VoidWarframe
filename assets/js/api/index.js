/* Unified public API for VoidWarframe data sources.
   Hierarchy: memory (instant) → storage (cached) → bundle (offline) → live API.
   Live API is always tried in background if cached data is stale, with results
   broadcast via ApiEvents so subscribers can re-render without flicker.

   Two flavours per source:
     - getLatest(kind, lang): { data, source, ageMs }  — instant, never throws
     - refresh(kind, lang): Promise<void>              — force live API + emit
*/

import { endpointUrl } from "./endpoints.js";
import { httpJson } from "./client.js";
import { transform } from "./transforms.js";
import { loadBundle, bundleTs } from "./bundle.js";
import {
  readMemory, writeMemory, readStorage, writeStorage,
  isFresh, ageMs,
} from "./cache.js";
import { emitUpdated, emitFailed, ApiEvents } from "./events.js";

const refreshDebounce = new Map(); // key → lastTs

function key(kind, lang) { return `${kind}.${lang}`; }

async function fromApi(kind, lang) {
  const url = endpointUrl(kind, lang);
  const raw = await httpJson(key(kind, lang), url);
  const data = transform(kind, raw);
  const ts = Date.now();
  writeMemory(kind, lang, data, ts);
  writeStorage(kind, lang, data, ts);
  emitUpdated(kind, lang, "api", 0);
  return { data, source: "api", ageMs: 0 };
}

async function fromBundle(kind, lang) {
  const raw = await loadBundle(kind, lang);
  if (!raw || (Array.isArray(raw) && !raw.length)) return null;
  const data = transform(kind, raw);
  const ts = (await bundleTs(kind, lang)) || Date.now();
  writeMemory(kind, lang, data, ts);
  writeStorage(kind, lang, data, ts);
  return { data, source: "bundle", ageMs: ageMs(ts) };
}

function maybeRefresh(kind, lang) {
  const k = key(kind, lang);
  const last = refreshDebounce.get(k) || 0;
  if (Date.now() - last < 30 * 1000) return;
  refreshDebounce.set(k, Date.now());
  fromApi(kind, lang).catch((err) => emitFailed(kind, lang, err));
}

/* ------------ Public ------------ */

/**
 * Get latest available data for a (kind, lang). Never throws.
 * Synchronously returns memory hit; otherwise resolves via storage/bundle.
 * Always schedules a background API refresh if data is stale or missing.
 */
export async function getLatest(kind, lang) {
  // 1) Memory (instant).
  const mem = readMemory(kind, lang);
  if (mem) {
    if (!isFresh(kind, mem.ts)) maybeRefresh(kind, lang);
    return { data: mem.data, source: "memory", ageMs: ageMs(mem.ts) };
  }
  // 2) Storage.
  const stored = readStorage(kind, lang);
  if (stored) {
    writeMemory(kind, lang, stored.data, stored.ts);
    if (!isFresh(kind, stored.ts)) maybeRefresh(kind, lang);
    return { data: stored.data, source: "storage", ageMs: ageMs(stored.ts) };
  }
  // 3) Live API first try (worldstate prefers live anyway).
  try {
    return await fromApi(kind, lang);
  } catch (err) {
    emitFailed(kind, lang, err);
    // 4) Bundle as last resort.
    const fromB = await fromBundle(kind, lang);
    if (fromB) return fromB;
    // Truly nothing — empty payload, no throw.
    const empty = transform(kind, []);
    return { data: empty, source: "empty", ageMs: null };
  }
}

/** Force a fresh API request now. */
export async function refresh(kind, lang) {
  refreshDebounce.set(key(kind, lang), Date.now());
  try { await fromApi(kind, lang); }
  catch (err) { emitFailed(kind, lang, err); }
}

/** Convenience wrappers. */
export const getWorldstateLatest = (lang) => getLatest("worldstate", lang);
export const getModsLatest       = (lang) => getLatest("mods", lang);
export const getArcanesLatest    = (lang) => getLatest("arcanes", lang);
export const getItemsLatest      = (lang) => getLatest("items", lang);

export { ApiEvents };
