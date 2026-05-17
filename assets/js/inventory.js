import { initI18n, applyI18n, setLang, getLang, onLangChange, t } from "./i18n.js";
import { initSidebar } from "./sidebar.js";
import { injectGlyphs } from "./glyphs.js";
import { getMods, getArcanes, getShards } from "./inventory/data.js";
import {
  buildModCard, buildArcaneCard, buildShardCard,
  filterMods, filterArcanes, filterShards,
  renderGrid, attachToggleHandler,
} from "./inventory/render.js";
import { onInventoryChange, countOwned, clearKind } from "./inventory/state.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const FILTERS_KEY = "vw_inv_filters_v1";

const filters = loadFilters();

function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (raw) return Object.assign(defaults(), JSON.parse(raw));
  } catch {}
  return defaults();
}
function defaults() {
  return {
    kind: "mods",            // mods | arcanes | shards
    topCategory: "all",       // all | weapons | warframe | archwing | companion | other
    subCategory: "",          // primary | secondary | melee | archwing | archgun | archmelee | necramech | other
    search: "",
    polarity: "all",
    rarity: "all",
    color: "all",
    tauforged: "all",
    ownedOnly: false,
  };
}
function saveFilters() {
  try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); } catch {}
}

let data = { mods: [], arcanes: [], shards: [] };

async function loadData(lang) {
  $("#inv-grid").innerHTML = `<div class="empty-state" style="grid-column:1/-1">${t("inv.loading")}</div>`;
  const [mods, arcanes, shards] = await Promise.all([
    getMods(lang), getArcanes(lang), Promise.resolve(getShards(lang)),
  ]);
  data = { mods, arcanes, shards };
  rerender();
}

function rerender() {
  const grid = $("#inv-grid");
  applyKindUiVisibility();

  if (filters.kind === "mods") {
    const filtered = filterMods(data.mods, filters);
    renderGrid(grid, filtered, buildModCard);
    setCount(filtered.length, data.mods.length);
  } else if (filters.kind === "arcanes") {
    const filtered = filterArcanes(data.arcanes, filters);
    renderGrid(grid, filtered, buildArcaneCard);
    setCount(filtered.length, data.arcanes.length);
  } else if (filters.kind === "shards") {
    const filtered = filterShards(data.shards, filters);
    renderGrid(grid, filtered, buildShardCard);
    setCount(filtered.length, data.shards.length);
  }
  updateOwnedCounts();
  applyI18n();
}

function setCount(n, total) {
  const el = $("#inv-count");
  if (el) el.textContent = t("inv.shown", { n, total });
}

function applyKindUiVisibility() {
  // Sub-tabs and filter chips that differ between kinds
  const showCategories = filters.kind === "mods";
  const showPolarity   = filters.kind === "mods";
  const showRarity     = filters.kind === "mods";
  const showColor      = filters.kind === "shards";
  const showTauforged  = filters.kind === "shards";

  $("#inv-categories").hidden = !showCategories;
  $("#inv-sub-categories").hidden = !showCategories || filters.topCategory === "all" || filters.topCategory === "warframe" || filters.topCategory === "companion";

  $("#filter-polarity-group").hidden = !showPolarity;
  $("#filter-rarity-group").hidden = !showRarity;
  $("#filter-color-group").hidden = !showColor;
  $("#filter-tauforged-group").hidden = !showTauforged;
}

function updateOwnedCounts() {
  $$("[data-owned-count]").forEach((el) => {
    el.textContent = String(countOwned(el.dataset.ownedCount));
  });
}

function syncUi() {
  // Kind tabs
  $$("[data-kind]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === filters.kind)));
  // Top categories
  $$("[data-top]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.top === filters.topCategory)));
  $$("[data-sub]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sub === filters.subCategory)));
  // Filters
  $$("[data-polarity]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.polarity === filters.polarity)));
  $$("[data-rarity]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rarity === filters.rarity)));
  $$("[data-color]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.color === filters.color)));
  $$("[data-tauforged]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tauforged === filters.tauforged)));
  $("#inv-owned-only").checked = filters.ownedOnly;
  $("#inv-search").value = filters.search;
}

function setupHandlers() {
  const root = $("#inventory-root");

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;

    if (b.dataset.kind) {
      filters.kind = b.dataset.kind;
      filters.subCategory = "";
      saveFilters(); syncUi(); rerender(); return;
    }
    if (b.dataset.top) {
      filters.topCategory = b.dataset.top;
      filters.subCategory = "";
      saveFilters(); syncUi(); rerender(); return;
    }
    if (b.dataset.sub !== undefined) {
      filters.subCategory = filters.subCategory === b.dataset.sub ? "" : b.dataset.sub;
      saveFilters(); syncUi(); rerender(); return;
    }
    if (b.dataset.polarity) { filters.polarity = b.dataset.polarity; saveFilters(); syncUi(); rerender(); return; }
    if (b.dataset.rarity)   { filters.rarity   = b.dataset.rarity;   saveFilters(); syncUi(); rerender(); return; }
    if (b.dataset.color)    { filters.color    = b.dataset.color;    saveFilters(); syncUi(); rerender(); return; }
    if (b.dataset.tauforged){ filters.tauforged= b.dataset.tauforged;saveFilters(); syncUi(); rerender(); return; }

    if (b.dataset.action === "reset") {
      const def = defaults();
      def.kind = filters.kind;
      Object.assign(filters, def);
      saveFilters(); syncUi(); rerender();
      return;
    }
    if (b.dataset.action === "clear-owned") {
      if (confirm(t("inv.confirmClear"))) {
        clearKind(filters.kind);
        rerender();
      }
      return;
    }
  });

  const search = $("#inv-search");
  let st;
  search.addEventListener("input", (e) => {
    clearTimeout(st);
    st = setTimeout(() => {
      filters.search = e.target.value;
      saveFilters(); rerender();
    }, 150);
  });

  $("#inv-owned-only").addEventListener("change", (e) => {
    filters.ownedOnly = e.target.checked;
    saveFilters(); rerender();
  });

  attachToggleHandler(root);
  onInventoryChange(() => updateOwnedCounts());
}

function setupLangSwitcher() {
  $$(".header__lang button").forEach((b) => {
    b.addEventListener("click", async () => {
      const lang = b.dataset.lang;
      if (lang === getLang()) return;
      await setLang(lang);
      await loadData(lang);
    });
  });
  const sync = (lang) => $$(".header__lang button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  sync(getLang());
  onLangChange(sync);
}

async function bootstrap() {
  try {
    await initI18n();
    await injectGlyphs();
    initSidebar();
    setupLangSwitcher();
    applyI18n();
    setupHandlers();
    syncUi();
    await loadData(getLang());
  } catch (err) {
    console.error("[VW] inventory bootstrap failed:", err);
    const grid = $("#inv-grid");
    if (grid) grid.innerHTML = `<div class="status-banner status-banner--error" style="grid-column:1/-1">${t("errors.api")} — ${err && err.message || err}</div>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
