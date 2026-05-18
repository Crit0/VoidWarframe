import { STORAGE, TTL } from "./endpoints.js";

const memory = new Map();   // key → { data, ts }

function storeFor(kind) {
  const s = STORAGE[kind];
  if (!s) return null;
  return s.type === "session" ? sessionStorage : localStorage;
}
function storageKey(kind, lang) {
  return `${STORAGE[kind].prefix}${lang}`;
}

export function readMemory(kind, lang) {
  return memory.get(`${kind}.${lang}`) || null;
}
export function writeMemory(kind, lang, data, ts = Date.now()) {
  memory.set(`${kind}.${lang}`, { data, ts });
}

export function readStorage(kind, lang) {
  try {
    const store = storeFor(kind);
    if (!store) return null;
    const raw = store.getItem(storageKey(kind, lang));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    return { ts, data };
  } catch { return null; }
}

export function writeStorage(kind, lang, data, ts = Date.now()) {
  try {
    const store = storeFor(kind);
    if (!store) return;
    store.setItem(storageKey(kind, lang), JSON.stringify({ ts, data }));
  } catch { /* quota / private mode */ }
}

export function isFresh(kind, ts) {
  if (!ts) return false;
  return Date.now() - ts < TTL[kind];
}

export function ageMs(ts) {
  return ts ? Date.now() - ts : null;
}

export function clearMemory() { memory.clear(); }
