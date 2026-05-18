import { initI18n, applyI18n, setLang, getLang, onLangChange, t } from "./i18n.js";
import { initSidebar } from "./sidebar.js";
import { injectGlyphs } from "./glyphs.js";
import { getMods, getArcanes, getShards, getLastFetchError, getBundleAge } from "./inventory/data.js";
import { CacheBus } from "./cache-bus.js";
import { renderDataAge } from "./sections/data-age.js";
import {
  buildModCard, buildArcaneCard, buildShardCard,
  filterMods, filterArcanes, filterShards,
  sortItems, renderGrid, renderPager, attachToggleHandler,
} from "./inventory/render.js";
import { SUBCATEGORIES_BY_TOP } from "./inventory/categories.js";
import { onInventoryChange, countOwned, clearKind } from "./inventory/state.js";

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const FILTERS_KEY = "vw_inv_filters_v2";
const PER_PAGE = 60;

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
    kind: "mods",
    topCategory: "all",
    subCategory: "",
    search: "",
    polarity: "all",
    rarity: "all",
    families: [],         // Array<string> — chosen mod families
    color: "all",
    tauforged: "all",
    ownedOnly: false,
    sort: { key: "name", dir: "asc" },
    page: 1,
  };
}
function saveFilters() {
  try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); } catch {}
}

let data = { mods: [], arcanes: [], shards: [] };

async function loadData(lang, { force = false } = {}) {
  const grid = $("#inv-grid");
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${t("inv.loading")}</div>`;
  const [mods, arcanes, shards] = await Promise.all([
    getMods(lang, { force }),
    getArcanes(lang, { force }),
    Promise.resolve(getShards(lang)),
  ]);
  data = { mods, arcanes, shards };

  const hasData = filters.kind === "mods" ? mods.length
                : filters.kind === "arcanes" ? arcanes.length
                : shards.length;
  const err = filters.kind === "mods"    ? getLastFetchError("mods", lang)
            : filters.kind === "arcanes" ? getLastFetchError("arcanes", lang)
            : null;
  if (err && !hasData) { showInventoryError(err); return; }
  rerender();
  updateAgeBadge(lang);
}

async function updateAgeBadge(lang) {
  const el = $("#inv-age");
  if (!el || filters.kind === "shards") { if (el) el.hidden = true; return; }
  const age = await getBundleAge(filters.kind, lang);
  renderDataAge(el, age, "bundle");
}

function showInventoryError(err) {
  const grid = $("#inv-grid");
  const msg = (err && err.message) || String(err);
  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  grid.innerHTML = `
    <div class="status-banner status-banner--error" style="grid-column:1/-1">
      <span>${escape(t("errors.api"))} — ${escape(msg)}</span>
      <button class="status-banner__retry" type="button">${escape(t("errors.retry"))}</button>
    </div>`;
  const btn = grid.querySelector(".status-banner__retry");
  if (btn) btn.addEventListener("click", () => loadData(getLang(), { force: true }));
  $("#inv-pager").innerHTML = "";
}

function currentFiltered() {
  if (filters.kind === "mods") {
    return sortItems(filterMods(data.mods, filters), filters.sort, "mods");
  }
  if (filters.kind === "arcanes") {
    return sortItems(filterArcanes(data.arcanes, filters), filters.sort, "arcanes");
  }
  return sortItems(filterShards(data.shards, filters), filters.sort, "shards");
}

function rerender() {
  applyKindUiVisibility();
  applySubCategoryUiVisibility();

  const items = currentFiltered();
  // Clamp page
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  if (filters.page > totalPages) filters.page = totalPages;
  if (filters.page < 1) filters.page = 1;

  const grid = $("#inv-grid");
  const builder = filters.kind === "mods" ? buildModCard
                : filters.kind === "arcanes" ? buildArcaneCard
                : buildShardCard;
  renderGrid(grid, items, builder, { page: filters.page, perPage: PER_PAGE });

  renderPager($("#inv-pager"), items.length, filters.page, PER_PAGE, (p) => {
    filters.page = p;
    saveFilters();
    rerender();
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  setCount(items.length, totalCount());
  updateOwnedCounts();
  applyI18n();
}

function totalCount() {
  return data[filters.kind] ? data[filters.kind].length : 0;
}

function setCount(n, total) {
  const el = $("#inv-count");
  if (el) el.textContent = t("inv.shown", { n, total });
}

function applyKindUiVisibility() {
  const showCategories = filters.kind === "mods" || filters.kind === "arcanes";
  const showPolarity   = filters.kind === "mods";
  const showRarity     = filters.kind === "mods";
  const showFamilies   = filters.kind === "mods";
  const showColor      = filters.kind === "shards";
  const showTauforged  = filters.kind === "shards";
  const showSortDrain  = filters.kind === "mods";
  const showSortPolarity = filters.kind === "mods";

  $("#group-categories").hidden = !showCategories;
  $("#group-polarity").hidden = !showPolarity;
  $("#group-rarity").hidden = !showRarity;
  $("#group-families").hidden = !showFamilies;
  $("#group-color").hidden = !showColor;
  $("#group-tauforged").hidden = !showTauforged;
  $("#sort-drain").hidden = !showSortDrain;
  $("#sort-polarity").hidden = !showSortPolarity;

  // Arcane categories — hide "companion" for arcanes
  $$("[data-top='companion']").forEach((b) => b.hidden = filters.kind === "arcanes");
}

function applySubCategoryUiVisibility() {
  const subs = SUBCATEGORIES_BY_TOP[filters.topCategory] || [];
  $("#group-subcategories").hidden = subs.length === 0;
  $$("[data-sub]").forEach((b) => {
    b.hidden = !subs.includes(b.dataset.sub);
  });
}

function updateOwnedCounts() {
  $$("[data-owned-count]").forEach((el) => {
    el.textContent = String(countOwned(el.dataset.ownedCount));
  });
}

function syncUi() {
  $$("[data-kind]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === filters.kind)));
  $$("[data-top]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.top === filters.topCategory)));
  $$("[data-sub]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sub === filters.subCategory)));
  $$("[data-polarity]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.polarity === filters.polarity)));
  $$("[data-rarity]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rarity === filters.rarity)));
  $$("[data-family]").forEach((b) => b.setAttribute("aria-pressed", String(filters.families.includes(b.dataset.family))));
  $$("[data-color]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.color === filters.color)));
  $$("[data-tauforged]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tauforged === filters.tauforged)));
  $$("[data-sort-key]").forEach((b) => {
    const active = b.dataset.sortKey === filters.sort.key;
    b.setAttribute("aria-pressed", String(active));
    b.dataset.dir = active ? filters.sort.dir : "asc";
  });
  $("#inv-owned-only").checked = filters.ownedOnly;
  $("#inv-search").value = filters.search;

  const badge = $("#inv-filter-count");
  if (badge) {
    const n = activeFilterCount(filters);
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }
}

function activeFilterCount(f) {
  let n = 0;
  if (f.polarity !== "all") n++;
  if (f.rarity   !== "all") n++;
  if (Array.isArray(f.families) && f.families.length) n += f.families.length;
  if (f.color    !== "all") n++;
  if (f.tauforged!== "all") n++;
  if ((f.search || "").trim()) n++;
  if (f.ownedOnly) n++;
  if (f.sort && (f.sort.key !== "name" || f.sort.dir !== "asc")) n++;
  return n;
}

function setupFilterSheet() {
  const sheet = $("#inv-sheet");
  const btn = $("[data-open-sheet]");
  if (!sheet) return;
  const open  = () => { sheet.classList.add("is-open"); document.body.classList.add("body-lock"); };
  const close = () => { sheet.classList.remove("is-open"); document.body.classList.remove("body-lock"); };
  if (btn) btn.addEventListener("click", open);
  sheet.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) close();
  });
}

function resetPage() { filters.page = 1; }

function setupHandlers() {
  const root = $("#inventory-root");

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;

    if (b.dataset.kind) {
      filters.kind = b.dataset.kind;
      filters.subCategory = "";
      resetPage(); saveFilters(); syncUi();
      const err = getLastFetchError(filters.kind, getLang());
      if (err) showInventoryError(err);
      else rerender();
      return;
    }
    if (b.dataset.top) {
      filters.topCategory = b.dataset.top;
      filters.subCategory = "";
      resetPage(); saveFilters(); syncUi(); rerender(); return;
    }
    if (b.dataset.sub !== undefined) {
      filters.subCategory = filters.subCategory === b.dataset.sub ? "" : b.dataset.sub;
      resetPage(); saveFilters(); syncUi(); rerender(); return;
    }
    if (b.dataset.polarity) { filters.polarity = b.dataset.polarity; resetPage(); saveFilters(); syncUi(); rerender(); return; }
    if (b.dataset.rarity)   { filters.rarity   = b.dataset.rarity;   resetPage(); saveFilters(); syncUi(); rerender(); return; }
    if (b.dataset.family)   {
      const set = new Set(filters.families);
      if (set.has(b.dataset.family)) set.delete(b.dataset.family);
      else set.add(b.dataset.family);
      filters.families = Array.from(set);
      resetPage(); saveFilters(); syncUi(); rerender(); return;
    }
    if (b.dataset.color)    { filters.color = b.dataset.color; resetPage(); saveFilters(); syncUi(); rerender(); return; }
    if (b.dataset.tauforged){ filters.tauforged = b.dataset.tauforged; resetPage(); saveFilters(); syncUi(); rerender(); return; }
    if (b.dataset.sortKey)  {
      if (filters.sort.key === b.dataset.sortKey) {
        filters.sort.dir = filters.sort.dir === "asc" ? "desc" : "asc";
      } else {
        filters.sort.key = b.dataset.sortKey;
        filters.sort.dir = "asc";
      }
      saveFilters(); syncUi(); rerender(); return;
    }

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
      resetPage(); saveFilters(); rerender();
    }, 180);
  });

  $("#inv-owned-only").addEventListener("change", (e) => {
    filters.ownedOnly = e.target.checked;
    resetPage(); saveFilters(); rerender();
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
    setupFilterSheet();
    syncUi();

    CacheBus.addEventListener("mods-updated", (e) => {
      if (e.detail.lang !== getLang()) return;
      loadData(getLang());
    });
    CacheBus.addEventListener("arcanes-updated", (e) => {
      if (e.detail.lang !== getLang()) return;
      loadData(getLang());
    });

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
