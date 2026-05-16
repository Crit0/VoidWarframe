import { t, getLang } from "../i18n.js";
import { CONFIG } from "../config.js";

let tickerInterval;

function formatTimeLeft(ms, lang) {
  if (ms <= 0) return lang === "ru" ? "завершено" : "ended";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (d) parts.push(`${d}${lang === "ru" ? "д" : "d"}`);
  if (h || d) parts.push(`${h}${lang === "ru" ? "ч" : "h"}`);
  parts.push(`${String(m).padStart(2, "0")}m`);
  if (!d) parts.push(`${String(s).padStart(2, "0")}s`);
  return parts.join(" ");
}

function alertTitle(a, lang) {
  const mission = a.mission || {};
  const node = mission.node || "";
  const type = mission.type || "";
  return node && type ? `${type} — ${node}` : node || type || t("alerts.unknown");
}

function alertReward(a) {
  const r = a.mission && a.mission.reward;
  if (!r) return "";
  if (r.asString) return r.asString;
  const items = [...(r.items || []), ...(r.countedItems || []).map((c) => `${c.count}× ${c.type}`)];
  const credits = r.credits ? `${r.credits} cr` : "";
  return [items.join(", "), credits].filter(Boolean).join(" • ");
}

function renderSkeletons(container) {
  container.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const sk = document.createElement("div");
    sk.className = "skel-card";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width: 30%"></div>
      <div class="skeleton skel-line" style="width: 80%; height: 18px"></div>
      <div class="skeleton skel-line" style="width: 60%"></div>
    `;
    container.appendChild(sk);
  }
}

function renderError(container, onRetry) {
  container.innerHTML = `
    <div class="status-banner status-banner--error" style="grid-column: 1 / -1">
      <span>${t("errors.api")}</span>
      <button class="status-banner__retry" type="button">${t("errors.retry")}</button>
    </div>
  `;
  container.querySelector(".status-banner__retry").addEventListener("click", onRetry);
}

function renderEmpty(container) {
  container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1">${t("alerts.empty")}</div>`;
}

export function renderAlerts(container, { alerts = [], events = [] } = {}, { stale = false } = {}) {
  const lang = getLang();
  clearInterval(tickerInterval);

  const items = [];
  alerts.slice(0, CONFIG.ALERTS_LIMIT).forEach((a) => {
    items.push({
      kind: "alert",
      title: alertTitle(a, lang),
      meta: a.mission?.faction || "",
      reward: alertReward(a),
      expiry: a.expiry,
    });
  });
  events.slice(0, CONFIG.ALERTS_LIMIT).forEach((e) => {
    items.push({
      kind: "event",
      title: e.description || e.name || t("alerts.event"),
      meta: e.tooltip || e.node || "",
      reward: (e.rewards && e.rewards[0]?.asString) || "",
      expiry: e.expiry,
    });
  });

  if (!items.length) return renderEmpty(container);

  container.innerHTML = "";
  if (stale) {
    const banner = document.createElement("div");
    banner.className = "status-banner";
    banner.style.gridColumn = "1 / -1";
    banner.textContent = t("errors.cached");
    container.appendChild(banner);
  }

  items.forEach((it, idx) => {
    const card = document.createElement("article");
    card.className = `alert-card${it.kind === "event" ? " alert-card--event" : ""}`;
    card.innerHTML = `
      <div class="alert-card__head">
        <span class="alert-card__tag">${t(it.kind === "event" ? "alerts.event" : "alerts.alert")}</span>
        <span class="alert-card__timer" data-expiry="${it.expiry || ""}">—</span>
      </div>
      <h3 class="alert-card__title"></h3>
      ${it.meta ? `<div class="alert-card__meta"></div>` : ""}
      ${it.reward ? `<div class="alert-card__reward"></div>` : ""}
    `;
    card.querySelector(".alert-card__title").textContent = it.title;
    if (it.meta) card.querySelector(".alert-card__meta").textContent = it.meta;
    if (it.reward) card.querySelector(".alert-card__reward").textContent = it.reward;
    container.appendChild(card);
  });

  const tick = () => {
    const now = Date.now();
    container.querySelectorAll("[data-expiry]").forEach((el) => {
      const exp = el.dataset.expiry;
      if (!exp) { el.textContent = ""; return; }
      const left = new Date(exp).getTime() - now;
      el.textContent = formatTimeLeft(left, lang);
    });
  };
  tick();
  tickerInterval = setInterval(tick, 1000);
}

export { renderSkeletons as renderAlertsSkeletons, renderError as renderAlertsError };
