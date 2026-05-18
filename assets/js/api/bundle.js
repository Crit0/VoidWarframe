/* Local bundle loader (assets/data/<kind>.<lang>.json + manifest.json). */

const DATA_BASE = new URL("../../data/", import.meta.url).href;

const memo = new Map();

let manifestP = null;
export function loadManifest() {
  if (manifestP) return manifestP;
  manifestP = (async () => {
    try {
      const res = await fetch(`${DATA_BASE}manifest.json`, { cache: "default" });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  })();
  return manifestP;
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

export async function bundleTs(kind, lang) {
  const m = await loadManifest();
  const f = m?.files?.[`${kind}.${lang}`];
  if (!f?.ts) return null;
  const t = Date.parse(f.ts);
  return Number.isFinite(t) ? t : null;
}
