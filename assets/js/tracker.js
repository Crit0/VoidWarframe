import { CONFIG } from "./config.js";
import { initI18n, applyI18n, setLang, getLang, onLangChange, t } from "./i18n.js";
import { getWorldstate } from "./api.js";
import { getItemsDict } from "./items.js";
import { CacheBus } from "./cache-bus.js";
import { renderDataAge } from "./sections/data-age.js";
import { initSidebar } from "./sidebar.js";
import { initReveal } from "./animations.js";
import { injectGlyphs } from "./glyphs.js";
import {
  getSettings, onSettingsChange, mountRightRail, mountSheet, mountTabs,
} from "./tracker/settings.js";
import { startTicker } from "./tracker/format.js";
import { startRefreshCycle, formatRefreshRemaining } from "./tracker/refresh.js";
import { initModal, openEventModal } from "./tracker/modal.js";
import { entryById, resetEntryRegistry } from "./tracker/sections/_card.js";
import * as Cycles from "./tracker/sections/cycles.js";
import * as Activities from "./tracker/sections/activities.js";
import * as Fissures from "./tracker/sections/fissures.js";
import * as Live from "./tracker/sections/live.js";
import * as Nightwave from "./tracker/sections/nightwave.js";
import * as Traders from "./tracker/sections/traders.js";
import * as Recommended from "./tracker/sections/recommended.js";
import * as Syndicates from "./tracker/sections/syndicates.js";
import * as Calendar from "./tracker/sections/calendar.js";
import * as Upgrades from "./tracker/sections/upgrades.js";
import { startWorldstatePolling } from "./poll.js";
import { mountApiStatus } from "./sections/api-status.js";
import "./sw-register.js";

let lastData = null;
let lastStatus = "ok"; // ok | stale | error
let itemsDict = null;

const $ = (sel) => document.querySelector(sel);

function ctxNow() {
  return { lang: getLang(), settings: getSettings(), status: lastStatus, items: itemsDict };
}

function prefetchItems() {
  const lang = getLang();
  const start = () => {
    getItemsDict(lang).then((d) => {
      itemsDict = d;
      if (lastData) renderAll();
    }).catch((e) => console.warn("[VW] items prefetch:", e));
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(start, { timeout: 4000 });
  } else {
    setTimeout(start, 1200);
  }
}

function setupLangSwitcher() {
  document.querySelectorAll(".header__lang button").forEach((b) => {
    b.addEventListener("click", async () => {
      const lang = b.dataset.lang;
      if (lang === getLang()) return;
      await setLang(lang);
      itemsDict = null;
      await loadAndRender(true);
      prefetchItems();
    });
  });
  const sync = (lang) => {
    document.querySelectorAll(".header__lang button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang))
    );
  };
  sync(getLang());
  onLangChange(sync);
}

function setupFilterSheet() {
  const sheet = $("#tracker-sheet");
  const btn = $("[data-open-sheet]");
  if (sheet) mountSheet(sheet);
  if (btn && sheet) btn.addEventListener("click", () => sheet.classList.add("is-open"));
}

function setServerStatus(state) {
  lastStatus = state;
  document.querySelectorAll("[data-server-status]").forEach((el) => {
    el.dataset.state = state;
    const text = el.querySelector(".status-pill__text, .sidebar__status-text");
    if (text) text.textContent = t(`tracker.server.${state}`);
  });
}

function updateTabCounts() {
  if (!lastData) return;
  const counts = computeTabCounts(lastData);
  document.querySelectorAll(".tracker-tab[data-tab]").forEach((b) => {
    const c = counts[b.dataset.tab];
    const badge = b.querySelector(".tracker-tab__count");
    if (badge) badge.textContent = c != null ? String(c) : "0";
  });
}

function computeTabCounts(d) {
  const len = (v) => (Array.isArray(v) ? v.length : 0);
  const activitiesCount =
    (d.sortie && !d.sortie.expired ? 1 : 0) +
    (d.archonHunt && !d.archonHunt.expired ? 1 : 0) +
    (d.arbitration && !d.arbitration.expired && d.arbitration.node ? 1 : 0) +
    (Array.isArray(d.archimedeas) ? d.archimedeas.length : 0) +
    (d.steelPath ? 1 : 0);
  const liveCount = len(d.events) + len(d.alerts) + (d.invasions || []).filter((i) => !i.completed).length;
  const fissuresCount = len(d.fissures);
  const tradersCount =
    (d.voidTrader ? 1 : 0) + (d.vaultTrader ? 1 : 0) + ((d.dailyDeals || []).length ? 1 : 0) + (d.nightwave ? 1 : 0);

  return {
    all: activitiesCount + liveCount + fissuresCount + 6,
    important: activitiesCount,
    daily: (d.sortie && !d.sortie.expired ? 1 : 0) + (d.arbitration && !d.arbitration.expired ? 1 : 0),
    weekly: (d.archonHunt && !d.archonHunt.expired ? 1 : 0) + (Array.isArray(d.archimedeas) ? d.archimedeas.length : 0) + (d.steelPath ? 1 : 0),
    cycles: 6,
    operations: liveCount,
    traders: tradersCount,
  };
}

function applyTabVisibility() {
  const tab = getSettings().tab;
  const map = {
    "section-recommended": tab === "all" || tab === "important",
    "section-cycles":      tab === "all" || tab === "cycles",
    "section-activities":  tab === "all" || tab === "important" || tab === "daily" || tab === "weekly",
    "section-fissures":    tab === "all" || tab === "important",
    "section-live":        tab === "all" || tab === "operations" || tab === "important",
    "section-nightwave":   tab === "all" || tab === "weekly",
    "section-traders":     tab === "all" || tab === "traders",
  };
  Object.entries(map).forEach(([id, visible]) => {
    const el = document.getElementById(id);
    if (el) el.hidden = !visible;
  });
}

function renderAll() {
  if (!lastData) return;
  const ctx = ctxNow();
  resetEntryRegistry();
  Recommended.renderHighlight($("#recommended-highlight"), lastData, ctx);
  Cycles.renderCycles($("#cycles-grid"), lastData, ctx);
  Activities.renderActivities($("#activities-grid"), lastData, ctx);
  Fissures.renderFissures($("#fissures-wrap"), lastData, ctx);
  Live.renderLive($("#live-grid"), lastData, ctx);
  Nightwave.renderNightwave($("#nightwave-grid"), lastData, ctx);
  Traders.renderTraders($("#traders-grid"), lastData, ctx);
  Syndicates.render($("#syndicates-grid"), lastData.syndicateMissions);
  Upgrades.render($("#upgrades-grid"), lastData.globalUpgrades);
  Calendar.render($("#calendar-grid"), lastData);
  updateTabCounts();
  applyTabVisibility();
  applyI18n();
}

function setupCardClickDelegation() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".event-card");
    if (!card || !card.dataset.entryId) return;
    if (e.target.closest("a")) return;
    const entry = entryById.get(card.dataset.entryId);
    if (entry) openEventModal(entry);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".event-card");
    if (!card || !card.dataset.entryId) return;
    e.preventDefault();
    const entry = entryById.get(card.dataset.entryId);
    if (entry) openEventModal(entry);
  });
}

function renderSkeletons() {
  Cycles.renderSkeletons($("#cycles-grid"));
  Activities.renderSkeletons($("#activities-grid"));
  Fissures.renderSkeletons($("#fissures-wrap"));
  Live.renderSkeletons($("#live-grid"));
  Nightwave.renderSkeletons($("#nightwave-grid"));
  Traders.renderSkeletons($("#traders-grid"));
  Recommended.renderSkeletons($("#recommended-highlight"));
  applyI18n();
}

async function loadAndRender(force = false) {
  if (force) renderSkeletons();
  try {
    const { data, stale, source, ageMs } = await getWorldstate(getLang(), { force });
    lastData = data;
    setServerStatus(stale ? "stale" : "ok");
    renderAll();
    const ageEl = $("#tracker-stale");
    if (ageEl) renderDataAge(ageEl, ageMs, source);
  } catch (err) {
    console.error("[VW] tracker fetch failed:", (err && err.message) || String(err));
    setServerStatus("error");
    if (!lastData) {
      showFatal(err);
    }
  }
}

function showFatal(err) {
  const el = $("#tracker-stale");
  if (!el) return;
  el.hidden = false;
  el.classList.add("status-banner--error");
  const msg = (err && err.message) || String(err);
  el.textContent = `${t("errors.api")} — ${msg}`;
}

function setupRefreshUi() {
  const refreshLabel = $("#refresh-label");
  const refreshTime = $("#refresh-time");
  if (refreshLabel) refreshLabel.textContent = t("tracker.refresh.label");
  startRefreshCycle({
    intervalMs: CONFIG.CACHE_TTL_MS,
    onTick: (ms) => { if (refreshTime) refreshTime.textContent = formatRefreshRemaining(ms); },
    onRefresh: () => loadAndRender(true),
  });
}

async function bootstrap() {
  try {
    await initI18n();
    await injectGlyphs();
    initSidebar();
    setupLangSwitcher();
    setupFilterSheet();
    mountRightRail($(".right-rail"));
    mountTabs($(".tracker-tabs"));
    applyI18n();
    initModal($("#modal-root"));
    setupCardClickDelegation();
    startTicker(document);
    initReveal();
    setupRefreshUi();
    let renderDebounce;
    onSettingsChange(() => {
      clearTimeout(renderDebounce);
      renderDebounce = setTimeout(() => { if (lastData) renderAll(); }, 50);
    });
    CacheBus.addEventListener("worldstate-updated", (e) => {
      if (e.detail.lang !== getLang()) return;
      loadAndRender();
    });
    mountApiStatus($(".header__lang"));
    await loadAndRender();
    prefetchItems();
    startWorldstatePolling();
  } catch (err) {
    console.error("[VW] tracker bootstrap failed:", err);
    showFatal(err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
