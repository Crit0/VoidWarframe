import { CONFIG } from "./config.js";
import { initI18n, setLang, getLang, onLangChange, t } from "./i18n.js";
import { initSidebar } from "./sidebar.js";
import { initReveal, initHeroCanvas } from "./animations.js";
import { getWorldstate } from "./api.js";
import { CacheBus } from "./cache-bus.js";
import { startWorldstatePolling } from "./poll.js";
import { mountApiStatus } from "./sections/api-status.js";
import { injectGlyphs } from "./glyphs.js";
import "./sw-register.js";
import {
  renderNews,
  renderNewsSkeletons,
  renderNewsError,
} from "./sections/news.js";
import {
  renderAlerts,
  renderAlertsSkeletons,
  renderAlertsError,
} from "./sections/alerts.js";

function setupLangSwitcher() {
  const buttons = document.querySelectorAll(".header__lang button");
  const sync = (lang) => {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  };
  sync(getLang());
  buttons.forEach((b) => {
    b.addEventListener("click", async () => {
      const lang = b.dataset.lang;
      if (lang === getLang()) return;
      await setLang(lang);
      sync(lang);
      loadAndRender();
    });
  });
  onLangChange(sync);
}

async function loadAndRender() {
  const lang = getLang();
  const newsEl = document.querySelector("#news-grid");
  const alertsEl = document.querySelector("#alerts-grid");
  if (newsEl) renderNewsSkeletons(newsEl);
  if (alertsEl) renderAlertsSkeletons(alertsEl);

  try {
    const { data, stale } = await getWorldstate(lang);
    if (newsEl) renderNews(newsEl, data.news || [], { stale });
    if (alertsEl)
      renderAlerts(
        alertsEl,
        { alerts: data.alerts || [], events: data.events || [] },
        { stale },
      );
  } catch (err) {
    console.error("[VW] main API error:", (err && err.message) || String(err));
    if (newsEl) renderNewsError(newsEl, loadAndRender);
    if (alertsEl) renderAlertsError(alertsEl, loadAndRender);
  }
}

function setupSmoothCtas() {
  document.querySelectorAll('a[data-scroll]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function showFatal(err) {
  const banner = document.createElement("div");
  banner.className = "status-banner status-banner--error";
  banner.style.cssText = "max-width:1280px;margin:1.5rem auto;";
  const msg = (err && err.message) || String(err);
  banner.textContent = `Ошибка инициализации / Init error: ${msg}`;
  const main = document.querySelector(".main main") || document.body;
  main.prepend(banner);
}

async function bootstrap() {
  try {
    await initI18n();
    await injectGlyphs();
    initSidebar();
    setupLangSwitcher();
    setupSmoothCtas();
    initHeroCanvas();
    initReveal();
    mountApiStatus(document.querySelector(".header__lang"));
    CacheBus.addEventListener("worldstate-updated", (e) => {
      if (e.detail.lang !== getLang()) return;
      loadAndRender();
    });
    loadAndRender();
    startWorldstatePolling();
  } catch (err) {
    console.error("[VW] home bootstrap failed:", err);
    showFatal(err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
