import { t } from "../../i18n.js";
import { setFissureTab } from "../settings.js";
import { buildEventCard, buildEmpty } from "./_card.js";

const TIER_NORMALIZE = {
  "lith": "lith", "meso": "meso", "neo": "neo", "axi": "axi", "requiem": "requiem",
  "лит": "lith", "мезо": "meso", "нео": "neo", "акси": "axi", "реквием": "requiem",
};
const TIER_ORDER = { requiem: 0, lith: 1, meso: 2, neo: 3, axi: 4 };

function normalizeTier(tier) {
  return TIER_NORMALIZE[String(tier || "").toLowerCase()] || "";
}

export function renderSkeletons(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="tabs" role="tablist">
      <button type="button" class="tabs__btn" aria-selected="true" data-tab="normal" data-i18n="tracker.fissures.normal"></button>
      <button type="button" class="tabs__btn" aria-selected="false" data-tab="steelPath" data-i18n="tracker.fissures.sp"></button>
    </div>
    <div class="events-list">
      ${Array.from({ length: 4 }).map(() => `
        <div class="skel-card" style="min-height:120px">
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

  const wrap = document.createElement("div");
  wrap.className = "events-list";
  if (!list.length) {
    buildEmpty(wrap);
  } else {
    list.slice(0, 8).forEach((f) => {
      wrap.appendChild(buildEventCard({
        kind: "fissure",
        tier: normalizeTier(f.tier) || f.tier,
        title: f.node || t("tracker.sections.fissures"),
        subtitle: [f.missionType, f.enemy, f.isStorm ? t("tracker.fissures.storm") : null].filter(Boolean).join(" · "),
        rewards: [f.tier],
        expiry: f.expiry,
        activation: f.activation,
      }));
    });
  }
  container.appendChild(wrap);
}
