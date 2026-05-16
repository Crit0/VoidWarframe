import { t } from "../../i18n.js";

const CYCLES = [
  { key: "earth",   field: "earthCycle",   stateFn: (c) => (c.isDay ? "day" : "night"),
    label: (s) => t(`tracker.cycles.earth.${s}`) },
  { key: "cetus",   field: "cetusCycle",   stateFn: (c) => (c.isDay ? "day" : "night"),
    label: (s) => t(`tracker.cycles.cetus.${s}`) },
  { key: "vallis",  field: "vallisCycle",  stateFn: (c) => (c.isWarm ? "warm" : "cold"),
    label: (s) => t(`tracker.cycles.vallis.${s}`) },
  { key: "cambion", field: "cambionCycle", stateFn: (c) => (c.active || c.state || "fass"),
    label: (s) => t(`tracker.cycles.cambion.${s}`) },
  { key: "duviri",  field: "duviriCycle",  stateFn: (c) => (c.state || "joy"),
    label: (s) => t(`tracker.cycles.duviri.${s}`) },
  { key: "zariman", field: "zarimanCycle", stateFn: (c) => (c.isCorpus ? "corpus" : "grineer"),
    label: (s) => t(`tracker.cycles.zariman.${s}`) },
];

const ICONS = {
  day: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',
  night: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 13A9 9 0 0111 3a7 7 0 1010 10z"/></svg>',
  warm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 14a4 4 0 104 0V4a2 2 0 10-4 0z"/><path d="M12 18v2M12 6h.01"/></svg>',
  cold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></svg>',
  fass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2C8 8 4 10 4 14a8 8 0 0016 0c0-4-4-6-8-12z"/></svg>',
  vome: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12c2-3 6-3 8 0M9 9h.01M15 9h.01"/></svg>',
  joy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
  anger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M16 16s-1.5-2-4-2-4 2-4 2M7 8l3 2M17 8l-3 2"/></svg>',
  sorrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/></svg>',
  fear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9 16c1-1 5-1 6 0M9 9h.01M15 9h.01"/></svg>',
  envy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 14h8M9 9l2 2M15 9l-2 2"/></svg>',
  corpus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="6" r="3"/><path d="M5 21l3-9h8l3 9"/></svg>',
  grineer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4h12v6a6 6 0 11-12 0z"/><path d="M9 13v3M15 13v3"/></svg>',
};

export function renderSkeletons(container) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < CYCLES.length; i++) {
    const sk = document.createElement("div");
    sk.className = "skel-card cycle-card";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width:40%"></div>
      <div class="skeleton skel-line" style="width:70%; height:18px"></div>
      <div class="skeleton skel-line" style="width:90%"></div>
    `;
    container.appendChild(sk);
  }
}

export function renderCycles(container, data) {
  if (!container) return;
  container.innerHTML = "";
  CYCLES.forEach((def) => {
    const c = data?.[def.field];
    if (!c) return;
    const s = String(def.stateFn(c)).toLowerCase();
    const icon = ICONS[s] || ICONS.day;
    const card = document.createElement("article");
    card.className = `cycle-card cycle-card--${s}`;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", t(`tracker.cycles.${def.key}.label`));
    card.innerHTML = `
      <div class="cycle-card__head">
        <span class="cycle-card__icon">${icon}</span>
        <div class="cycle-card__titles">
          <h3 class="cycle-card__planet" data-i18n="tracker.cycles.${def.key}.label">${def.key}</h3>
          <p class="cycle-card__state">${def.label(s)}</p>
        </div>
      </div>
      <div class="cycle-card__bar" aria-hidden="true">
        <div class="cycle-card__bar-fill" data-progress="${c.activation || ""}|${c.expiry || ""}"></div>
      </div>
      <div class="cycle-card__times">
        <span class="cycle-card__time" data-countdown="${c.expiry || ""}">—</span>
        <span class="cycle-card__local">${c.expiry ? new Date(c.expiry).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : ""}</span>
      </div>
    `;
    container.appendChild(card);
  });
  if (!container.children.length) {
    container.innerHTML = `<div class="empty-state">${t("tracker.empty.section")}</div>`;
  }
}
