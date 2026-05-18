import { CacheBus } from "../cache-bus.js";
import { t, onLangChange } from "../i18n.js";

let pillEl = null;
let state = "loading";

function applyState(s) {
  if (!pillEl) return;
  state = s;
  pillEl.className = `api-status api-status--${s}`;
  const txt = pillEl.querySelector(".api-status__text");
  if (txt) txt.textContent = t(`apiStatus.${s}`);
  pillEl.setAttribute("title", t(`apiStatus.${s}Tip`));
}

function fromSource(source) {
  if (source === "api") return "live";
  if (source === "session" || source === "session-old") return "stale";
  if (source === "bundle") return "offline";
  return "loading";
}

export function mountApiStatus(container) {
  if (!container) return;
  pillEl = document.createElement("div");
  pillEl.className = "api-status api-status--loading";
  pillEl.innerHTML = `<span class="api-status__dot" aria-hidden="true"></span><span class="api-status__text">…</span>`;
  container.appendChild(pillEl);
  applyState("loading");

  CacheBus.addEventListener("worldstate-updated", (e) => applyState(fromSource(e.detail.source)));
  CacheBus.addEventListener("worldstate-failed", () => applyState("offline"));
  onLangChange(() => applyState(state));
}
