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

const ACCESS_KEYS = ["sortie", "archonHunt", "archimedea", "steelPath"];
const LOOT_TYPES = ["prime", "relic", "archon", "steelEssence", "aya", "forma", "kuva", "endo", "nitain"];

const DEFAULTS = Object.freeze({
  budgetMin: 60,
  recommend: { on: true, valuable: true, fits: true },
  filters: Object.fromEntries(FILTER_KEYS.map((k) => [k, true])),
  fissureTab: "normal",
  tab: "all",
  access: Object.fromEntries(ACCESS_KEYS.map((k) => [k, true])),
  loot:   { onlyRare: false, types: Object.fromEntries(LOOT_TYPES.map((k) => [k, false])) },
});

const listeners = new Set();
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(CONFIG.TRACKER_SETTINGS_KEY);
    if (!raw) return clone(DEFAULTS);
    return mergeDefaults(JSON.parse(raw));
  } catch {
    return clone(DEFAULTS);
  }
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function mergeDefaults(p) {
  const out = clone(DEFAULTS);
  if (typeof p.budgetMin === "number" || p.budgetMin === null) out.budgetMin = p.budgetMin;
  if (p.recommend) {
    out.recommend.on = !!p.recommend.on;
    out.recommend.valuable = !!p.recommend.valuable;
    out.recommend.fits = !!p.recommend.fits;
  }
  if (p.filters) {
    for (const k of FILTER_KEYS) if (typeof p.filters[k] === "boolean") out.filters[k] = p.filters[k];
  }
  if (p.fissureTab === "normal" || p.fissureTab === "steelPath") out.fissureTab = p.fissureTab;
  if (typeof p.tab === "string") out.tab = p.tab;
  if (p.access) {
    for (const k of ACCESS_KEYS) if (typeof p.access[k] === "boolean") out.access[k] = p.access[k];
  }
  if (p.loot) {
    out.loot.onlyRare = !!p.loot.onlyRare;
    if (p.loot.types) for (const k of LOOT_TYPES) if (typeof p.loot.types[k] === "boolean") out.loot.types[k] = p.loot.types[k];
  }
  return out;
}

function save() {
  try { localStorage.setItem(CONFIG.TRACKER_SETTINGS_KEY, JSON.stringify(state)); } catch {}
}

function emit() { listeners.forEach((fn) => fn(state)); }

export function getSettings() { return clone(state); }
export function onSettingsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setBudget(min) { state.budgetMin = min; save(); emit(); }
export function setRecommend(patch) { Object.assign(state.recommend, patch); save(); emit(); }
export function setFilter(key, value) { if (!(key in state.filters)) return; state.filters[key] = !!value; save(); emit(); }
export function setFissureTab(tab) { if (tab !== "normal" && tab !== "steelPath") return; state.fissureTab = tab; save(); emit(); }
export function setTab(tab) { state.tab = tab; save(); emit(); }
export function setAccess(key, value) { if (!(key in state.access)) return; state.access[key] = !!value; save(); emit(); }
export function setLootRare(value) { state.loot.onlyRare = !!value; save(); emit(); }
export function setLootType(key, value) { if (!(key in state.loot.types)) return; state.loot.types[key] = !!value; save(); emit(); }
export function resetSettings() { state = clone(DEFAULTS); save(); emit(); }

/* ============== UI helpers ============== */

function timeChipsHtml() {
  return `
    <div class="time-chips" data-group="budget" role="group">
      ${BUDGET_PRESETS.map((p) => `
        <button type="button" class="time-chip" data-min="${p.min ?? ""}" aria-pressed="false">
          ${t(`tracker.settings.budget.${p.key}`)}
        </button>
      `).join("")}
    </div>
  `;
}

function accessHtml() {
  return `
    <ul class="access-list">
      ${ACCESS_KEYS.map((k) => `
        <li>
          <label class="access-row">
            <input type="checkbox" data-access="${k}">
            <span class="access-row__name">${t(`tracker.access.${k}`)}</span>
            <span class="access-row__hint">${t(`tracker.access.${k}_hint`)}</span>
          </label>
        </li>
      `).join("")}
    </ul>
  `;
}

function lootHtml() {
  return `
    <label class="loot-toggle">
      <input type="checkbox" data-loot-rare>
      <span>${t("tracker.loot.onlyRare")}</span>
    </label>
    <div class="time-chips loot-chips" data-group="loot" role="group">
      ${LOOT_TYPES.map((k) => `
        <button type="button" class="time-chip" data-loot-type="${k}" aria-pressed="false">
          ${t(`tracker.loot.types.${k}`)}
        </button>
      `).join("")}
    </div>
  `;
}

function panelsHtml() {
  return `
    <div class="right-rail__panel right-rail__panel--gold ornate-corners">
      <span class="ornate-corner-l"></span><span class="ornate-corner-r"></span>
      <h3 class="right-rail__title">${t("tracker.rail.timeFilter")}</h3>
      <p class="right-rail__hint">${t("tracker.rail.timeHint")}</p>
      ${timeChipsHtml()}
    </div>

    <div class="right-rail__panel">
      <h3 class="right-rail__title">${t("tracker.access.title")}</h3>
      <p class="right-rail__hint">${t("tracker.access.hint")}</p>
      ${accessHtml()}
    </div>

    <div class="right-rail__panel">
      <h3 class="right-rail__title">${t("tracker.loot.title")}</h3>
      <p class="right-rail__hint">${t("tracker.loot.hint")}</p>
      ${lootHtml()}
    </div>

    <div class="right-rail__panel">
      <button type="button" class="map-cta" data-action="map">
        <svg><use href="#g-map"/></svg>
        ${t("tracker.rail.map")}
      </button>
      <p class="right-rail__hint" style="margin-top:0.6rem; margin-bottom:0">${t("tracker.rail.mapHint")}</p>
      <button type="button" class="tracker-reset" style="margin-top:0.85rem; width:100%" data-action="reset">${t("tracker.settings.reset")}</button>
    </div>
  `;
}

export function mountRightRail(root) {
  if (!root) return;
  root.innerHTML = panelsHtml();
  syncUi(root);
  wireRoot(root);
  onLangChange(() => mountRightRail(root));
}

export function mountSheet(root) {
  if (!root) return;
  root.innerHTML = `
    <div class="sheet__backdrop" data-close></div>
    <div class="sheet__panel">
      <div class="sheet__head">
        <h2 class="sheet__title">${t("tracker.sheet.title")}</h2>
        <button type="button" class="sheet__close" data-close aria-label="${t("tracker.sheet.close")}">×</button>
      </div>
      ${panelsHtml()}
    </div>
  `;
  syncUi(root);
  wireRoot(root);
  root.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => root.classList.remove("is-open")));
}

function wireRoot(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) {
      if (btn.dataset.min !== undefined) {
        const min = btn.dataset.min === "" ? null : Number(btn.dataset.min);
        setBudget(min);
        document.querySelectorAll(".time-chips [data-min]").forEach((b) => {
          const bm = b.dataset.min === "" ? null : Number(b.dataset.min);
          b.setAttribute("aria-pressed", String(bm === min));
        });
        return;
      }
      if (btn.dataset.lootType) {
        const key = btn.dataset.lootType;
        setLootType(key, !state.loot.types[key]);
        document.querySelectorAll(`[data-loot-type="${key}"]`).forEach((b) =>
          b.setAttribute("aria-pressed", String(state.loot.types[key])));
        return;
      }
      if (btn.dataset.action === "map") {
        const toast = document.querySelector(".toast") || (() => {
          const el = document.createElement("div");
          el.className = "toast";
          document.body.appendChild(el);
          return el;
        })();
        toast.textContent = t("tracker.rail.mapHint");
        toast.classList.add("is-visible");
        setTimeout(() => toast.classList.remove("is-visible"), 2200);
        return;
      }
      if (btn.dataset.action === "reset") {
        resetSettings();
        document.querySelectorAll(".tracker-settings-host, .right-rail, .sheet").forEach((host) => {
          if (host.classList.contains("right-rail")) mountRightRail(host);
          else if (host.classList.contains("sheet")) mountSheet(host);
        });
        return;
      }
    }
    const input = e.target.closest("input[type=checkbox]");
    if (input) {
      if (input.dataset.access) {
        setAccess(input.dataset.access, input.checked);
        document.querySelectorAll(`[data-access="${input.dataset.access}"]`).forEach((i) => { i.checked = input.checked; });
      } else if (input.hasAttribute("data-loot-rare")) {
        setLootRare(input.checked);
        document.querySelectorAll("[data-loot-rare]").forEach((i) => { i.checked = input.checked; });
      }
    }
  });
}

function syncUi(root) {
  root.querySelectorAll("[data-min]").forEach((b) => {
    const m = b.dataset.min === "" ? null : Number(b.dataset.min);
    b.setAttribute("aria-pressed", String(m === state.budgetMin));
  });
  root.querySelectorAll("[data-access]").forEach((i) => { i.checked = !!state.access[i.dataset.access]; });
  root.querySelectorAll("[data-loot-rare]").forEach((i) => { i.checked = !!state.loot.onlyRare; });
  root.querySelectorAll("[data-loot-type]").forEach((b) => {
    b.setAttribute("aria-pressed", String(!!state.loot.types[b.dataset.lootType]));
  });
}

/* ============== Tabs handler (outer page tabs) ============== */

export function mountTabs(root) {
  if (!root) return;
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    setTab(btn.dataset.tab);
    syncTabs(root);
  });
  syncTabs(root);
  onLangChange(() => syncTabs(root));
}

function syncTabs(root) {
  root.querySelectorAll("[data-tab]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.tab === state.tab));
  });
}

/* Legacy no-op */
export function mountSettingsStrip(_root) {}
