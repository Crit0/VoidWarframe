import { t } from "../i18n.js";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function classifyAge(ms) {
  if (ms == null) return "unknown";
  if (ms < 5 * MIN) return "fresh";
  if (ms < 12 * HOUR) return "stale";
  return "old";
}

export function formatAge(ms) {
  if (ms == null) return t("data.age.fresh");
  if (ms < MIN) return t("data.age.fresh");
  if (ms < HOUR) return t("data.age.minutes", { n: Math.floor(ms / MIN) });
  if (ms < DAY) return t("data.age.hours", { n: Math.floor(ms / HOUR) });
  const days = Math.floor(ms / DAY);
  if (ms >= 12 * HOUR && days >= 1) return t("data.age.days", { n: days });
  return t("data.age.hours", { n: Math.floor(ms / HOUR) });
}

export function renderDataAge(container, ms, source) {
  if (!container) return;
  const cls = classifyAge(ms);
  if (cls === "fresh" && source === "api") { container.hidden = true; return; }
  if (cls === "unknown") { container.hidden = true; return; }
  container.hidden = false;
  container.className = `data-age data-age--${cls}`;
  const text = cls === "old" ? t("data.age.old") + " · " + formatAge(ms) : formatAge(ms);
  container.innerHTML = `<span class="data-age__icon" aria-hidden="true">⌬</span><span class="data-age__text">${text}</span>`;
}
