/* Low-level HTTP: fetch with timeout, AbortController per (kind,lang),
   single inflight de-duplication, structured error logging. */

const inflight = new Map();   // key → AbortController
const promises = new Map();   // key → Promise

const DEFAULT_TIMEOUT_MS = 12000;

export async function httpJson(key, url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (promises.has(key)) return promises.get(key);

  // Cancel any prior request under the same key.
  const prev = inflight.get(key);
  if (prev) prev.abort();

  const ctrl = new AbortController();
  inflight.set(key, ctrl);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const p = (async () => {
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("json")) throw new Error(`non-JSON: ${ct}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
      if (inflight.get(key) === ctrl) inflight.delete(key);
      promises.delete(key);
    }
  })();

  promises.set(key, p);
  return p;
}

export function abortKey(key) {
  const c = inflight.get(key);
  if (c) c.abort();
  inflight.delete(key);
  promises.delete(key);
}
