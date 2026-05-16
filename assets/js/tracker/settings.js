import { CONFIG } from "../config.js";
import { t, onLangChange } from "../i18n.js";

const BUDGET_PRESETS = [
  { key: "15m", min: 15 },
  { key: "30m", min: 30 },
  { key: "1h", min: 60 },
  { key: "2h", min: 120 },
  { key: "4h", min: 240 },
  { key: "inf", min: null },
];

const FILTER_KEYS = [
  "cycles", "recommended", "sortie", "archon", "arbitration", "archimedea",
  "steelPath", "fissures", "alerts", "invasions", "events", "special",
  "nightwave", "traders",
];

const DEFAULTS = Object.freeze({
  budgetMin: 60,
  recommend: { on: true, valuable: true, fits: true },
  filters: Object.fromEntries(FILTER_KEYS.map((k) => [k, true])),
  fissureTab: "normal",
});

const listeners = new Set();
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(CONFIG.TRACKER_SETTINGS_KEY);
    if (!raw) return clone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return mergeDefaults(parsed);
  } catch {
    return clone(DEFAULTS);
  }
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function mergeDefaults(p) {
  const out = clone(DEFAULTS);
  if (typeof p.budgetMin === "number" || p.budgetMin === null) out.budgetMin = p.budgetMin;
  if (p.recommend) {
    out.recommend.on = !!p.recommend.on;
    out.recommend.valuable = !!p.recommend.valuable;
    out.recommend.fits = !!p.recommend.fits;
  }
  if (p.filters) {
    for (const k of FILTER_KEYS) {
      if (typeof p.filters[k] === "boolean") out.filters[k] = p.filters[k];
    }
  }
  if (p.fissureTab === "normal" || p.fissureTab === "steelPath") out.fissureTab = p.fissureTab;
  return out;
}

function save() {
  try { localStorage.setItem(CONFIG.TRACKER_SETTINGS_KEY, JSON.stringify(state)); } catch {}
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

export function getSettings() { return clone(state); }

export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setBudget(min) {
  state.budgetMin = min;
  save(); emit();
}

export function setRecommend(patch) {
  Object.assign(state.recommend, patch);
  save(); emit();
}

export function setFilter(key, value) {
  if (!(key in state.filters)) return;
  state.filters[key] = !!value;
  save(); emit();
}

export function setFissureTab(tab) {
  if (tab !== "normal" && tab !== "steelPath") return;
  state.fissureTab = tab;
  save(); emit();
}

export function resetSettings() {
  state = clone(DEFAULTS);
  save(); emit();
}

export function mountSettingsStrip(root) {
  if (!root) return;
  root.innerHTML = `
    <div class="tracker-settings__inner">
      <div class="tracker-settings__row">
        <span class="tracker-settings__label" data-i18n="tracker.settings.budget">Бюджет времени</span>
        <div class="tracker-chip-group" data-group="budget" role="group" aria-label="${t("tracker.settings.budget")}">
          ${BUDGET_PRESETS.map((p) => `
            <button type="button" class="tracker-chip tracker-chip--budget" data-budget="${p.key}" data-min="${p.min ?? ""}" aria-pressed="false" data-i18n="tracker.settings.budget.${p.key}"></button>
          `).join("")}
        </div>
      </div>
      <div class="tracker-settings__row">
        <span class="tracker-settings__label" data-i18n="tracker.settings.recommend">Рекомендации</span>
        <div class="tracker-chip-group" data-group="recommend">
          <button type="button" class="tracker-chip tracker-chip--toggle" data-rec="on" aria-pressed="false" data-i18n="tracker.settings.recommend.on"></button>
          <button type="button" class="tracker-chip tracker-chip--toggle" data-rec="valuable" aria-pressed="false" data-i18n="tracker.settings.recommend.valuable"></button>
          <button type="button" class="tracker-chip tracker-chip--toggle" data-rec="fits" aria-pressed="false" data-i18n="tracker.settings.recommend.fits"></button>
        </div>
      </div>
      <div class="tracker-settings__row">
        <span class="tracker-settings__label" data-i18n="tracker.settings.filters">Фильтры</span>
        <div class="tracker-chip-group" data-group="filters">
          ${FILTER_KEYS.map((k) => `
            <button type="button" class="tracker-chip tracker-chip--filter" data-filter="${k}" aria-pressed="false" data-i18n="tracker.filters.${k}"></button>
          `).join("")}
        </div>
        <button type="button" class="tracker-reset" data-i18n="tracker.settings.reset">Сброс</button>
      </div>
    </div>
  `;

  syncUi(root);

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.classList.contains("tracker-reset")) { resetSettings(); syncUi(root); return; }
    if (btn.dataset.budget) {
      const min = btn.dataset.min === "" ? null : Number(btn.dataset.min);
      setBudget(min);
      syncUi(root);
      return;
    }
    if (btn.dataset.rec) {
      setRecommend({ [btn.dataset.rec]: !state.recommend[btn.dataset.rec] });
      syncUi(root);
      return;
    }
    if (btn.dataset.filter) {
      setFilter(btn.dataset.filter, !state.filters[btn.dataset.filter]);
      syncUi(root);
      return;
    }
  });

  onLangChange(() => syncUi(root));
}

function syncUi(root) {
  root.querySelectorAll("[data-budget]").forEach((b) => {
    const min = b.dataset.min === "" ? null : Number(b.dataset.min);
    b.setAttribute("aria-pressed", String(min === state.budgetMin));
  });
  root.querySelectorAll("[data-rec]").forEach((b) => {
    b.setAttribute("aria-pressed", String(!!state.recommend[b.dataset.rec]));
  });
  root.querySelectorAll("[data-filter]").forEach((b) => {
    b.setAttribute("aria-pressed", String(!!state.filters[b.dataset.filter]));
  });
}
