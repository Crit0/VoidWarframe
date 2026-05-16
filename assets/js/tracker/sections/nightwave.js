import { t } from "../../i18n.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function challengeRow(c) {
  const tagClass = c.isElite ? "is-elite" : c.isDaily ? "is-daily" : "is-weekly";
  const tag = c.isElite ? t("tracker.nightwave.elite") : c.isDaily ? t("tracker.nightwave.daily") : t("tracker.nightwave.weekly");
  return `
    <li class="nightwave-row ${tagClass}">
      <span class="nightwave-row__tag">${tag}</span>
      <div class="nightwave-row__body">
        <h4 class="nightwave-row__title">${escapeHtml(c.title || "")}</h4>
        <p class="nightwave-row__desc">${escapeHtml(c.desc || "")}</p>
      </div>
      <span class="nightwave-row__rep">${escapeHtml(t("tracker.nightwave.rep", { n: c.reputation || 0 }))}</span>
    </li>
  `;
}

export function renderSkeletons(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="skel-card" style="grid-column:1/-1">
      <div class="skeleton skel-line" style="width:40%"></div>
      <div class="skeleton skel-line" style="width:90%"></div>
      <div class="skeleton skel-line" style="width:80%"></div>
      <div class="skeleton skel-line" style="width:70%"></div>
    </div>
  `;
}

export function renderNightwave(container, data) {
  if (!container) return;
  const nw = data.nightwave;
  if (!nw || !Array.isArray(nw.activeChallenges) || !nw.activeChallenges.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${t("tracker.empty.section")}</div>`;
    return;
  }
  const daily = nw.activeChallenges.filter((c) => c.isDaily);
  const weekly = nw.activeChallenges.filter((c) => !c.isDaily && !c.isElite);
  const elite = nw.activeChallenges.filter((c) => c.isElite);
  const seasonLabel = nw.season != null ? t("tracker.nightwave.series", { n: nw.season }) : (nw.tag || "");
  container.innerHTML = `
    <div class="nightwave-card" style="grid-column:1/-1">
      <div class="nightwave-card__head">
        <h3 class="nightwave-card__title">${escapeHtml(seasonLabel)}</h3>
        ${nw.expiry ? `<span class="alert-card__timer" data-expiry-phrase="${nw.expiry}">—</span>` : ""}
      </div>
      <ul class="nightwave-list">
        ${daily.map(challengeRow).join("")}
        ${weekly.map(challengeRow).join("")}
        ${elite.map(challengeRow).join("")}
      </ul>
    </div>
  `;
}
