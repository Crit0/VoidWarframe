import { initI18n, applyI18n, setLang, getLang, onLangChange, t } from "./i18n.js";
import { getWorldstate } from "./api.js";
import { initSidebar } from "./sidebar.js";
import { initReveal } from "./animations.js";
import { mountSettingsStrip, getSettings, onSettingsChange } from "./tracker/settings.js";
import { startTicker } from "./tracker/format.js";
import * as Cycles from "./tracker/sections/cycles.js";
import * as Activities from "./tracker/sections/activities.js";
import * as Fissures from "./tracker/sections/fissures.js";
import * as Live from "./tracker/sections/live.js";
import * as Nightwave from "./tracker/sections/nightwave.js";
import * as Traders from "./tracker/sections/traders.js";
import * as Recommended from "./tracker/sections/recommended.js";

let lastData = null;
let lastStale = false;

function $(sel) { return document.querySelector(sel); }

function ctxNow() {
  return { lang: getLang(), settings: getSettings(), stale: lastStale };
}

function setupLangSwitcher() {
  const buttons = document.querySelectorAll(".header__lang button");
  const sync = (lang) => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  sync(getLang());
  buttons.forEach((b) => {
    b.addEventListener("click", async () => {
      const lang = b.dataset.lang;
      if (lang === getLang()) return;
      await setLang(lang);
      sync(lang);
      await loadAndRender(true);
    });
  });
  onLangChange(sync);
}

function applyVisibility() {
  const s = getSettings();
  const sectionMap = {
    "section-recommended": s.filters.recommended && s.recommend.on,
    "section-cycles": s.filters.cycles,
    "section-activities": s.filters.sortie || s.filters.archon || s.filters.arbitration || s.filters.archimedea || s.filters.steelPath,
    "section-fissures": s.filters.fissures,
    "section-live": s.filters.alerts || s.filters.invasions || s.filters.events || s.filters.special,
    "section-nightwave": s.filters.nightwave,
    "section-traders": s.filters.traders,
  };
  Object.entries(sectionMap).forEach(([id, visible]) => {
    const el = document.getElementById(id);
    if (el) el.hidden = !visible;
  });
}

function renderAll() {
  if (!lastData) return;
  const ctx = ctxNow();
  Recommended.renderRecommended($("#recommended-grid"), lastData, ctx);
  Cycles.renderCycles($("#cycles-grid"), lastData, ctx);
  Activities.renderActivities($("#activities-grid"), lastData, ctx);
  Fissures.renderFissures($("#fissures-wrap"), lastData, ctx);
  Live.renderLive($("#live-grid"), lastData, ctx);
  Nightwave.renderNightwave($("#nightwave-grid"), lastData, ctx);
  Traders.renderTraders($("#traders-grid"), lastData, ctx);
  applyVisibility();
  applyI18n();
  toggleStaleBanner(ctx.stale);
}

function toggleStaleBanner(stale) {
  const el = $("#tracker-stale");
  if (!el) return;
  el.hidden = !stale;
  el.textContent = stale ? t("errors.cached") : "";
}

function renderSkeletons() {
  Cycles.renderSkeletons($("#cycles-grid"));
  Activities.renderSkeletons($("#activities-grid"));
  Fissures.renderSkeletons($("#fissures-wrap"));
  Live.renderSkeletons($("#live-grid"));
  Nightwave.renderSkeletons($("#nightwave-grid"));
  Traders.renderSkeletons($("#traders-grid"));
  Recommended.renderSkeletons($("#recommended-grid"));
  applyI18n();
}

async function loadAndRender(force = false) {
  renderSkeletons();
  try {
    const { data, stale } = await getWorldstate(getLang(), { force });
    lastData = data;
    lastStale = !!stale;
    renderAll();
  } catch (err) {
    console.error("Tracker API error:", err);
    showErrorBanner();
  }
}

function showErrorBanner() {
  const el = $("#tracker-stale");
  if (!el) return;
  el.hidden = false;
  el.classList.add("status-banner--error");
  el.innerHTML = `<span>${t("errors.api")}</span><button class="status-banner__retry" type="button">${t("errors.retry")}</button>`;
  el.querySelector(".status-banner__retry").addEventListener("click", () => {
    el.classList.remove("status-banner--error");
    loadAndRender(true);
  });
}

async function bootstrap() {
  await initI18n();
  initSidebar();
  setupLangSwitcher();
  mountSettingsStrip($(".tracker-settings"));
  applyI18n();
  startTicker(document);
  initReveal();
  onSettingsChange(() => { if (lastData) renderAll(); });
  await loadAndRender();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
