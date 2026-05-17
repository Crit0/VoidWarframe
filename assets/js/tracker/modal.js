import { t, getLang } from "../i18n.js";
import { artClassOf, glyphOf, statusOf, statusLabel, typeLabel } from "./categorize.js";
import { formatCountdown, formatLocal } from "./format.js";
import { translateReward } from "./labels.js";

let root = null;

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function wikiUrl(entry) {
  const map = {
    sortie: "Sortie", archonHunt: "Archon_Hunt", arbitration: "Arbitration",
    archimedea: "Deep_Archimedea", steelPath: "The_Steel_Path",
    invasion: "Invasion", alert: "Alert", event: "Operation",
    special: "Operation", fissure: "Void_Fissure", nightwave: "Nightwave",
  };
  const slug = map[entry.kind] || "Warframe";
  return `https://warframe.fandom.com/wiki/${slug}`;
}

function variantsHtml(entry) {
  const list = entry.variants || [];
  if (!list.length) return "";
  return `
    <section class="modal__section">
      <h4 class="modal__h">${escapeHtml(t("tracker.modal.where"))}</h4>
      <ul class="modal__list">
        ${list.map((v) => `<li>${escapeHtml([v.missionType, v.node, v.modifier].filter(Boolean).join(" · "))}</li>`).join("")}
      </ul>
    </section>
  `;
}

function rewardsHtml(entry) {
  const arr = Array.isArray(entry.rewards) ? entry.rewards : (entry.rewards ? [entry.rewards] : []);
  if (!arr.length) return "";
  return `
    <section class="modal__section">
      <h4 class="modal__h">${escapeHtml(t("tracker.rewardsLabel"))}</h4>
      <ul class="modal__rewards">
        ${arr.map((r) => `<li>${escapeHtml(translateReward(r))}</li>`).join("")}
      </ul>
    </section>
  `;
}

function timeHtml(entry) {
  if (!entry.expiry) return "";
  const ms = new Date(entry.expiry).getTime() - Date.now();
  const left = formatCountdown(ms, getLang());
  const local = formatLocal(entry.expiry);
  return `
    <section class="modal__section">
      <h4 class="modal__h">${escapeHtml(t("tracker.modal.time"))}</h4>
      <p class="modal__time">
        <span class="modal__time-left" data-countdown="${entry.expiry}">${escapeHtml(left)}</span>
        <span class="modal__time-local">${escapeHtml(t("tracker.modal.until", { time: local }))}</span>
      </p>
    </section>
  `;
}

function buildHtml(entry) {
  const status = entry.status || statusOf(entry);
  const typeName = typeLabel(entry.kind);
  const art = artClassOf(entry.kind, entry.tier);
  const glyph = glyphOf(entry.kind, entry.tier);

  return `
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" class="modal__close" data-close aria-label="${escapeHtml(t("tracker.sheet.close"))}">×</button>
      <div class="modal__hero event-art ${art} event-art--scanline">
        <svg class="event-art__glyph" aria-hidden="true"><use href="#${glyph}"/></svg>
        <span class="event-status event-status--${status}">${escapeHtml(statusLabel(status))}</span>
      </div>
      <div class="modal__body">
        <div>
          <span class="event-type event-type--${entry.kind === "archonHunt" ? "archon" : entry.kind}">${escapeHtml(typeName)}</span>
          <h2 id="modal-title" class="modal__title">${escapeHtml(entry.title || "")}</h2>
          ${entry.subtitle ? `<p class="modal__subtitle">${escapeHtml(entry.subtitle)}</p>` : ""}
        </div>
        ${variantsHtml(entry)}
        ${rewardsHtml(entry)}
        ${timeHtml(entry)}
        <div class="modal__actions">
          <a class="event-card__btn" href="${wikiUrl(entry)}" target="_blank" rel="noopener">${escapeHtml(t("tracker.modal.wiki"))}</a>
          <button type="button" class="tracker-reset" data-close>${escapeHtml(t("tracker.sheet.close"))}</button>
        </div>
      </div>
    </div>
  `;
}

export function initModal(rootEl) { root = rootEl; }

function onEsc(e) { if (e.key === "Escape") closeModal(); }

export function closeModal() {
  if (!root) return;
  root.classList.remove("is-open");
  document.removeEventListener("keydown", onEsc);
}

export function openEventModal(entry) {
  if (!root || !entry) return;
  root.innerHTML = buildHtml(entry);
  root.classList.add("is-open");
  root.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", onEsc);
}
