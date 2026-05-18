/* Backwards-compatible items dictionary using new api/ layer. */

import { CONFIG } from "./config.js";
import { getItemsLatest, refresh, ApiEvents } from "./api/index.js";

const dictCache = new Map(); // lang → built dict (Map indices)

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
  if (dictCache.has(lang)) return dictCache.get(lang);
  const { data } = await getItemsLatest(lang);
  const dict = buildIndex(Array.isArray(data) ? data : []);
  dictCache.set(lang, dict);
  return dict;
}

// Rebuild dictionary when items refreshed from API.
ApiEvents.addEventListener("items:updated", (e) => {
  const lang = e.detail.lang;
  dictCache.delete(lang);
});

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
