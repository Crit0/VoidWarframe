import { t, getLang } from "../i18n.js";
import { CONFIG } from "../config.js";

const FALLBACK_IMG = "https://cdn.warframestat.us/genesis/img/news-placeholder.png";

function formatDate(iso, lang) {
  try {
    return new Date(iso).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function pickTitle(item, lang) {
  if (item.translations && item.translations[lang]) return item.translations[lang];
  return item.message || "";
}

function renderSkeletons(container) {
  container.innerHTML = "";
  for (let i = 0; i < CONFIG.NEWS_LIMIT; i++) {
    const sk = document.createElement("div");
    sk.className = "skel-card";
    sk.innerHTML = `
      <div class="skeleton skel-img"></div>
      <div class="skeleton skel-line" style="width: 40%"></div>
      <div class="skeleton skel-line" style="width: 90%"></div>
      <div class="skeleton skel-line" style="width: 70%"></div>
    `;
    container.appendChild(sk);
  }
}

function renderError(container, onRetry) {
  container.innerHTML = `
    <div class="status-banner status-banner--error" style="grid-column: 1 / -1">
      <span>${t("errors.api")}</span>
      <button class="status-banner__retry" type="button">${t("errors.retry")}</button>
    </div>
  `;
  container.querySelector(".status-banner__retry").addEventListener("click", onRetry);
}

function renderEmpty(container) {
  container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1">${t("news.empty")}</div>`;
}

export function renderNews(container, news, { stale = false } = {}) {
  const lang = getLang();
  if (!news || !news.length) return renderEmpty(container);

  const items = [...news]
    .filter((n) => !n.eta || true)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, CONFIG.NEWS_LIMIT);

  container.innerHTML = "";
  if (stale) {
    const banner = document.createElement("div");
    banner.className = "status-banner";
    banner.style.gridColumn = "1 / -1";
    banner.textContent = t("errors.cached");
    container.appendChild(banner);
  }
  items.forEach((item) => {
    const a = document.createElement("a");
    a.className = "news-card";
    a.href = item.link || "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const img = item.imageLink || FALLBACK_IMG;
    const title = pickTitle(item, lang);
    a.innerHTML = `
      <img class="news-card__img" src="${img}" alt="" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
      <div class="news-card__body">
        <span class="news-card__date">${formatDate(item.date, lang)}</span>
        <h3 class="news-card__title"></h3>
        <span class="news-card__cta">${t("news.readMore")}</span>
      </div>
    `;
    a.querySelector(".news-card__title").textContent = title;
    container.appendChild(a);
  });
}

export { renderSkeletons as renderNewsSkeletons, renderError as renderNewsError };
