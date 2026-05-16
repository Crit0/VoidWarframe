import { t } from "../../i18n.js";
import { setFissureTab } from "../settings.js";

const TIER_NORMALIZE = {
  "lith": "lith", "meso": "meso", "neo": "neo", "axi": "axi", "requiem": "requiem",
  "лит": "lith", "мезо": "meso", "нео": "neo", "акси": "axi", "реквием": "requiem",
};
const TIER_ORDER = { requiem: 0, lith: 1, meso: 2, neo: 3, axi: 4 };

function normalizeTier(tier) {
  return TIER_NORMALIZE[String(tier || "").toLowerCase()] || "";
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fissureCard(f) {
  const tier = normalizeTier(f.tier);
  const card = document.createElement("article");
  card.className = `alert-card alert-card--fissure${tier ? ` alert-card--fissure-${tier}` : ""}`;
  card.innerHTML = `
    <div class="alert-card__head">
      <span class="alert-card__tag">${escapeHtml(f.tier || "")}${f.isStorm ? " · " + t("tracker.fissures.storm") : ""}${f.isHard ? " · " + t("tracker.fissures.hard") : ""}</span>
      <span class="alert-card__timer" data-countdown="${f.expiry || ""}">—</span>
    </div>
    <h3 class="alert-card__title">${escapeHtml(f.node || "")}</h3>
    <div class="alert-card__meta">${escapeHtml([f.missionType, f.enemy].filter(Boolean).join(" · "))}</div>
  `;
  return card;
}

export function renderSkeletons(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="tabs" role="tablist">
      <button type="button" class="tabs__btn" aria-selected="true" data-tab="normal" data-i18n="tracker.fissures.normal"></button>
      <button type="button" class="tabs__btn" aria-selected="false" data-tab="steelPath" data-i18n="tracker.fissures.sp"></button>
    </div>
    <div class="grid fissures-grid">
      ${Array.from({ length: 6 }).map(() => `
        <div class="skel-card">
          <div class="skeleton skel-line" style="width:25%"></div>
          <div class="skeleton skel-line" style="width:70%; height:18px"></div>
          <div class="skeleton skel-line" style="width:55%"></div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderFissures(container, data, ctx) {
  if (!container) return;
  const tab = ctx.settings.fissureTab;
  const all = Array.isArray(data.fissures) ? data.fissures : [];
  const list = all
    .filter((f) => (tab === "steelPath" ? f.isHard : !f.isHard))
    .sort((a, b) => {
      const ta = TIER_ORDER[normalizeTier(a.tier)] ?? 99;
      const tb = TIER_ORDER[normalizeTier(b.tier)] ?? 99;
      if (ta !== tb) return ta - tb;
      return new Date(a.expiry) - new Date(b.expiry);
    });

  container.innerHTML = "";
  const tabs = document.createElement("div");
  tabs.className = "tabs";
  tabs.setAttribute("role", "tablist");
  tabs.innerHTML = `
    <button type="button" class="tabs__btn" aria-selected="${tab === "normal"}" data-tab="normal">${t("tracker.fissures.normal")}</button>
    <button type="button" class="tabs__btn" aria-selected="${tab === "steelPath"}" data-tab="steelPath">${t("tracker.fissures.sp")}</button>
  `;
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    setFissureTab(btn.dataset.tab);
  });
  container.appendChild(tabs);

  const grid = document.createElement("div");
  grid.className = "grid fissures-grid";
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${t("tracker.empty.section")}</div>`;
  } else {
    list.forEach((f) => grid.appendChild(fissureCard(f)));
  }
  container.appendChild(grid);
}
