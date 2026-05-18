const DATA_BASE = new URL("../data/", import.meta.url).href;

const memo = new Map();

let manifestPromise = null;
export function loadManifest() {
  if (manifestPromise) return manifestPromise;
  manifestPromise = (async () => {
    try {
      const res = await fetch(`${DATA_BASE}manifest.json`, { cache: "default" });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  })();
  return manifestPromise;
}

export function loadBundle(kind, lang) {
  const key = `${kind}.${lang}`;
  if (memo.has(key)) return memo.get(key);
  const p = (async () => {
    try {
      const res = await fetch(`${DATA_BASE}${key}.json`, { cache: "default" });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  })();
  memo.set(key, p);
  return p;
}

export async function bundleAgeMs(kind, lang) {
  const m = await loadManifest();
  const f = m?.files?.[`${kind}.${lang}`];
  if (!f || !f.ts) return null;
  const t = Date.parse(f.ts);
  if (!Number.isFinite(t)) return null;
  return Date.now() - t;
}

export async function manifestGeneratedMs() {
  const m = await loadManifest();
  if (!m?.generatedAt) return null;
  const t = Date.parse(m.generatedAt);
  return Number.isFinite(t) ? Date.now() - t : null;
}
