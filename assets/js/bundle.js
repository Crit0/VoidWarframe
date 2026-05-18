/* Legacy shim — delegates to assets/js/api/bundle.js. */
import { loadBundle, loadManifest, bundleTs } from "./api/bundle.js";
export { loadBundle, loadManifest };

export async function bundleAgeMs(kind, lang) {
  const ts = await bundleTs(kind, lang);
  return ts == null ? null : Date.now() - ts;
}

export async function manifestGeneratedMs() {
  const m = await loadManifest();
  if (!m?.generatedAt) return null;
  const t = Date.parse(m.generatedAt);
  return Number.isFinite(t) ? Date.now() - t : null;
}
