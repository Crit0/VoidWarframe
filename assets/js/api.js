/* Backwards-compatible shim. New code should import from "./api/index.js". */

import { getWorldstateLatest, refresh, ApiEvents } from "./api/index.js";

export async function getWorldstate(lang, { force = false } = {}) {
  if (force) await refresh("worldstate", lang);
  const r = await getWorldstateLatest(lang);
  const stale = r.source !== "api" && r.source !== "memory";
  return { data: r.data, stale, source: r.source, ageMs: r.ageMs };
}

export { ApiEvents };
