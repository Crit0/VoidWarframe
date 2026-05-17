import { t } from "../../i18n.js";
import { statusOf, statusLabel, typeLabel, artClassOf, typeClassOf, glyphOf } from "../categorize.js";

export const entryById = new Map();
let entrySeq = 0;
export function resetEntryRegistry() { entryById.clear(); entrySeq = 0; }

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Build a single .event-card DOM node.
 *
 * entry = {
 *   kind:       "sortie"|"archonHunt"|"arbitration"|"archimedea"|"steelPath"|
 *               "invasion"|"alert"|"event"|"special"|"fissure"|"nightwave",
 *   tier?:      string  (for kind=fissure)
 *   title:      string,
 *   subtitle?:  string,
 *   rewards?:   string[] | string,
 *   variants?:  [{missionType, node, modifier}],
 *   expiry?:    ISO string,
 *   activation?: ISO string,
 *   detailsUrl?: string,
 *   status?:    one of "important"|"urgent"|"new"|"active"
 * }
 */
export function buildEventCard(entry) {
  const status = entry.status || statusOf(entry);
  const tType = typeLabel(entry.kind);
  const artClass = artClassOf(entry.kind, entry.tier);
  const typeClass = typeClassOf(entry.kind);
  const glyph = glyphOf(entry.kind, entry.tier);

  const variantsHtml = (entry.variants || [])
    .map((v) => `<div>${escapeHtml([v.missionType, v.node, v.modifier].filter(Boolean).join(" · "))}</div>`)
    .join("");

  const rewardsArr = Array.isArray(entry.rewards) ? entry.rewards : (entry.rewards ? [entry.rewards] : []);
  const rewardChips = rewardsArr.slice(0, 4)
    .map((r) => `<span class="event-card__reward-chip event-card__reward-chip--gold">${escapeHtml(r)}</span>`)
    .join("");

  const id = `e${++entrySeq}`;
  entryById.set(id, entry);

  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.kind = entry.kind;
  card.dataset.status = status;
  card.dataset.entryId = id;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.innerHTML = `
    <span class="event-status event-status--${status}">${escapeHtml(statusLabel(status))}</span>
    <div class="event-card__art event-art ${artClass} event-art--scanline" aria-hidden="true">
      <svg class="event-art__glyph"><use href="#${glyph}"/></svg>
    </div>
    <div class="event-card__body">
      <div class="event-card__heading">
        <span class="event-type ${typeClass}">${escapeHtml(tType)}</span>
        <h3 class="event-card__title">${escapeHtml(entry.title || "")}</h3>
      </div>
      ${entry.subtitle ? `<p class="event-card__desc">${escapeHtml(entry.subtitle)}</p>` : ""}
      ${variantsHtml ? `<div class="event-card__variants">${variantsHtml}</div>` : ""}
      ${rewardChips ? `
        <div class="event-card__rewards">
          <span class="event-card__rewards-label">${escapeHtml(t("tracker.rewardsLabel"))}</span>
          <div class="event-card__rewards-list">${rewardChips}</div>
        </div>
      ` : ""}
      <div class="event-card__footer">
        <div class="event-card__time">
          <span class="event-card__time-label">${escapeHtml(t("tracker.timeLeft"))}</span>
          <span class="event-card__time-value" data-countdown="${entry.expiry || ""}">—</span>
        </div>
        ${entry.detailsUrl
          ? `<a class="event-card__btn" href="${entry.detailsUrl}" target="_blank" rel="noopener">${escapeHtml(t("tracker.details"))}</a>`
          : `<span class="event-card__btn" style="opacity:0.45; cursor:default">${escapeHtml(t("tracker.details"))}</span>`
        }
      </div>
    </div>
  `;
  return card;
}

export function buildEmpty(container, key = "tracker.empty.section") {
  if (!container) return;
  container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${escapeHtml(t(key))}</div>`;
}

export function buildSkeletons(container, count = 3) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skel-card";
    sk.style.minHeight = "150px";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width:30%"></div>
      <div class="skeleton skel-line" style="width:60%; height:18px"></div>
      <div class="skeleton skel-line" style="width:80%"></div>
      <div class="skeleton skel-line" style="width:50%"></div>
    `;
    container.appendChild(sk);
  }
}

export { escapeHtml };
