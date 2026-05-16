import { CONFIG } from "../../config.js";
import { t } from "../../i18n.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 60);
}

function itemIconUrl(item) {
  if (!item) return "";
  const candidate = item.icon || item.imageName || item.image || "";
  if (candidate && /^https?:/.test(candidate)) return candidate;
  if (candidate) return `${CONFIG.CDN_IMG}${candidate}`;
  const slug = slugify(item.item || item.name);
  return slug ? `${CONFIG.CDN_IMG}${slug}.png` : "";
}

function inventoryTable(inventory, costFields) {
  if (!inventory || !inventory.length) {
    return `<div class="empty-state">${t("tracker.traders.empty")}</div>`;
  }
  return `
    <ul class="trader-card__list">
      ${inventory.map((row) => {
        const icon = itemIconUrl({ item: row.item, icon: row.icon, imageName: row.imageName });
        return `
          <li class="trader-card__row">
            ${icon ? `<img class="trader-card__icon" src="${icon}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : `<span class="trader-card__icon"></span>`}
            <span class="trader-card__name">${escapeHtml(row.item || row.name || "")}</span>
            ${costFields.map((f) => f.value(row) != null ? `<span class="trader-card__cost trader-card__cost--${f.kind}">${escapeHtml(f.format(f.value(row)))}</span>` : `<span></span>`).join("")}
          </li>
        `;
      }).join("")}
    </ul>
  `;
}

function traderShell({ name, icon, activeLabel, expiryLine, location, modifier, bodyHtml }) {
  const card = document.createElement("article");
  card.className = `trader-card card${modifier ? ` ${modifier}` : ""}`;
  card.innerHTML = `
    <div class="trader-card__head">
      <div class="trader-card__brand">
        <span class="trader-card__avatar">${icon}</span>
        <div>
          <h3 class="trader-card__name-h">${escapeHtml(name)}</h3>
          ${location ? `<p class="trader-card__location">${escapeHtml(location)}</p>` : ""}
        </div>
      </div>
      <div class="trader-card__status">
        <span class="trader-card__state-tag">${activeLabel}</span>
        ${expiryLine ? expiryLine : ""}
      </div>
    </div>
    <div class="trader-card__body">${bodyHtml}</div>
  `;
  return card;
}

function baroIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 5-6 8-6s7 2 8 6"/></svg>';
}
function varziaIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"/></svg>';
}
function darvoIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18l-2 12H5z"/><path d="M9 7V4h6v3"/></svg>';
}
function nightwaveIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12c3-6 6-6 9 0s6 6 9 0"/></svg>';
}

function renderBaroVarzia(container, raw, { kind, name, icon }) {
  if (!raw) {
    container.appendChild(traderShell({
      name, icon,
      activeLabel: t("tracker.traders.away"),
      expiryLine: "",
      modifier: "trader-card--inactive",
      bodyHtml: `<div class="empty-state">${t("tracker.traders.empty")}</div>`,
    }));
    return;
  }
  const inventory = Array.isArray(raw.inventory) ? raw.inventory : [];
  const now = Date.now();
  const expiryMs = raw.expiry ? new Date(raw.expiry).getTime() : 0;
  const activationMs = raw.activation ? new Date(raw.activation).getTime() : 0;
  const hasFutureExpiry = expiryMs > now;
  const hasFutureActivation = activationMs > now;
  const isHere = raw.active === true || (inventory.length > 0 && hasFutureExpiry && !hasFutureActivation);
  const expiryLine = isHere
    ? `<span class="trader-card__timer" data-expiry-phrase="${raw.expiry || ""}">—</span>`
    : `<span class="trader-card__timer">${t("tracker.traders.arrives")} <span data-countdown="${raw.activation || ""}">—</span></span>`;
  const bodyHtml = isHere
    ? inventoryTable(inventory, [
        { kind: "ducats", value: (r) => r.ducats, format: (v) => `${v} ${t("tracker.traders.ducats")}` },
        { kind: "credits", value: (r) => r.credits, format: (v) => `${Number(v).toLocaleString()} ${t("tracker.traders.credits")}` },
      ])
    : `<p class="trader-card__hint">${escapeHtml(t("tracker.traders.arrivesAt"))} ${raw.activation ? new Date(raw.activation).toLocaleString() : "—"}</p>`;
  container.appendChild(traderShell({
    name,
    icon,
    activeLabel: isHere ? t("tracker.traders.here") : t("tracker.traders.away"),
    expiryLine,
    location: isHere ? raw.location : "",
    modifier: isHere ? "" : "trader-card--inactive",
    bodyHtml,
  }));
}

function renderDarvo(container, deals) {
  const arr = Array.isArray(deals) ? deals : [];
  if (!arr.length) {
    container.appendChild(traderShell({
      name: t("tracker.traders.darvo"),
      icon: darvoIcon(),
      activeLabel: t("tracker.traders.empty"),
      expiryLine: "",
      modifier: "trader-card--inactive",
      bodyHtml: `<div class="empty-state">${t("tracker.traders.empty")}</div>`,
    }));
    return;
  }
  const deal = arr[0];
  const body = `
    <ul class="trader-card__list">
      ${arr.map((d) => `
        <li class="trader-card__row trader-card__row--deal">
          <span class="trader-card__icon"></span>
          <span class="trader-card__name">${escapeHtml(d.item || "")}</span>
          <span class="trader-card__cost trader-card__cost--discount">-${d.discount || 0}%</span>
          <span class="trader-card__cost trader-card__cost--platinum">${d.salePrice} <s>${d.originalPrice}</s></span>
        </li>
      `).join("")}
    </ul>
  `;
  container.appendChild(traderShell({
    name: t("tracker.traders.darvo"),
    icon: darvoIcon(),
    activeLabel: t("tracker.traders.here"),
    expiryLine: `<span class="trader-card__timer" data-expiry-phrase="${deal.expiry || ""}">—</span>`,
    bodyHtml: body,
  }));
}

function renderNightwaveShop(container, nw) {
  const items = nw?.rewardTypes && nw.activeChallenges?.length
    ? null
    : null;
  container.appendChild(traderShell({
    name: t("tracker.traders.nightwave"),
    icon: nightwaveIcon(),
    activeLabel: nw?.expiry ? t("tracker.traders.here") : t("tracker.traders.away"),
    expiryLine: nw?.expiry ? `<span class="trader-card__timer" data-expiry-phrase="${nw.expiry}">—</span>` : "",
    bodyHtml: `<p class="trader-card__hint">${escapeHtml(t("tracker.traders.nightwaveHint"))}</p>`,
  }));
}

export function renderSkeletons(container) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const sk = document.createElement("div");
    sk.className = "skel-card";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width:30%"></div>
      <div class="skeleton skel-line" style="width:60%; height:18px"></div>
      <div class="skeleton skel-line" style="width:90%"></div>
      <div class="skeleton skel-line" style="width:80%"></div>
    `;
    container.appendChild(sk);
  }
}

export function renderTraders(container, data) {
  if (!container) return;
  container.innerHTML = "";
  renderBaroVarzia(container, data.voidTrader, {
    kind: "baro",
    name: t("tracker.traders.baro"),
    icon: baroIcon(),
  });
  renderBaroVarzia(container, data.vaultTrader, {
    kind: "varzia",
    name: t("tracker.traders.varzia"),
    icon: varziaIcon(),
  });
  renderDarvo(container, data.dailyDeals);
  renderNightwaveShop(container, data.nightwave);
}
