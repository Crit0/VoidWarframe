import { CONFIG } from "../../config.js";
import { t } from "../../i18n.js";
import { itemImageUrl, resolveItem } from "../../items.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function resolveRow(row, items) {
  const hit = resolveItem(row, items);
  return {
    rawName: row.item || row.name || "",
    name: (hit && hit.name) || row.item || row.name || "",
    image: itemImageUrl(hit),
    uniqueName: row.uniqueName || (hit && hit.uniqueName),
  };
}

function rowHtml(row, items, costsHtml) {
  const r = resolveRow(row, items);
  const icon = r.image
    ? `<img class="trader-card__icon" src="${r.image}" alt="" loading="lazy" decoding="async" onerror="this.removeAttribute('src'); this.setAttribute('data-empty','')">`
    : `<span class="trader-card__icon" data-empty></span>`;
  return `
    <li class="trader-card__row">
      ${icon}
      <span class="trader-card__name">${escapeHtml(r.name)}</span>
      ${costsHtml(row)}
    </li>
  `;
}

function inventoryListHtml(inventory, items, costsHtml) {
  if (!inventory || !inventory.length) {
    return `<div class="empty-state">${t("tracker.traders.empty")}</div>`;
  }
  return `<ul class="trader-card__list">${inventory.map((row) => rowHtml(row, items, costsHtml)).join("")}</ul>`;
}

function traderShell({ name, kind, glyphId, activeLabel, expiryLine, location, modifier, bodyHtml }) {
  const card = document.createElement("article");
  card.className = `trader-card card${modifier ? ` ${modifier}` : ""}`;
  card.innerHTML = `
    <div class="trader-card__head">
      <div class="trader-card__brand">
        <span class="trader-card__avatar" data-trader="${kind}" aria-hidden="true">
          <svg><use href="#${glyphId}"/></svg>
        </span>
        <div>
          <h3 class="trader-card__name-h">${escapeHtml(name)}</h3>
          ${location ? `<p class="trader-card__location">${escapeHtml(location)}</p>` : ""}
        </div>
      </div>
      <div class="trader-card__status">
        <span class="trader-card__state-tag">${activeLabel}</span>
        ${expiryLine || ""}
      </div>
    </div>
    <div class="trader-card__body">${bodyHtml}</div>
  `;
  return card;
}

function renderBaroVarzia(container, raw, { kind, name, glyphId, costLabelKey }, items) {
  if (!raw) {
    container.appendChild(traderShell({
      name, kind, glyphId,
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

  const PACK_RE = /\b(pack|bundle|set\s+pack|single\s+pack|dual\s+pack|пакет|сет|набор|комплект)\b/i;
  const isVarzia = kind === "varzia";
  const costsHtml = (row) => {
    const parts = [];
    if (row.regalAya != null) {
      parts.push(`<span class="trader-card__cost trader-card__cost--regal">${row.regalAya} ${t("tracker.traders.regalAya")}</span>`);
    }
    if (row.ducats != null) {
      let label = t(costLabelKey || "tracker.traders.ducats");
      let cls = "trader-card__cost--ducats";
      if (isVarzia) {
        if (PACK_RE.test(row.item || "")) {
          label = t("tracker.traders.regalAya");
          cls = "trader-card__cost--regal";
        }
      }
      parts.push(`<span class="trader-card__cost ${cls}">${row.ducats} ${label}</span>`);
    }
    if (row.credits != null) {
      parts.push(`<span class="trader-card__cost trader-card__cost--credits">${Number(row.credits).toLocaleString()} ${t("tracker.traders.credits")}</span>`);
    }
    return parts.join("");
  };

  const rotationHint = (isHere && kind === "varzia")
    ? `<p class="trader-card__hint" style="margin-top:0.6rem">${escapeHtml(t("tracker.traders.varziaHint"))}</p>`
    : "";

  const bodyHtml = isHere
    ? `${inventoryListHtml(inventory, items, costsHtml)}${rotationHint}`
    : `<p class="trader-card__hint">${escapeHtml(t("tracker.traders.arrivesAt"))} ${raw.activation ? new Date(raw.activation).toLocaleString() : "—"}</p>`;

  container.appendChild(traderShell({
    name, kind, glyphId,
    activeLabel: isHere ? t("tracker.traders.here") : t("tracker.traders.away"),
    expiryLine,
    location: isHere ? raw.location : "",
    modifier: isHere ? "" : "trader-card--inactive",
    bodyHtml,
  }));
}

function renderDarvo(container, deals, items) {
  const arr = Array.isArray(deals) ? deals : [];
  if (!arr.length) {
    container.appendChild(traderShell({
      name: t("tracker.traders.darvo"),
      kind: "darvo",
      glyphId: "g-shop",
      activeLabel: t("tracker.traders.empty"),
      expiryLine: "",
      modifier: "trader-card--inactive",
      bodyHtml: `<div class="empty-state">${t("tracker.traders.empty")}</div>`,
    }));
    return;
  }
  const deal = arr[0];
  const costsHtml = (row) => `
    <span class="trader-card__cost trader-card__cost--discount">-${row.discount || 0}%</span>
    <span class="trader-card__cost trader-card__cost--platinum">${row.salePrice} <s>${row.originalPrice}</s></span>
  `;
  const body = inventoryListHtml(arr, items, costsHtml);
  container.appendChild(traderShell({
    name: t("tracker.traders.darvo"),
    kind: "darvo",
    glyphId: "g-shop",
    activeLabel: t("tracker.traders.here"),
    expiryLine: `<span class="trader-card__timer" data-expiry-phrase="${deal.expiry || ""}">—</span>`,
    bodyHtml: body,
  }));
}

function renderNightwaveShop(container, nw) {
  container.appendChild(traderShell({
    name: t("tracker.traders.nightwave"),
    kind: "nightwave",
    glyphId: "g-wave",
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
    sk.style.minHeight = "180px";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width:30%"></div>
      <div class="skeleton skel-line" style="width:60%; height:18px"></div>
      <div class="skeleton skel-line" style="width:90%"></div>
      <div class="skeleton skel-line" style="width:80%"></div>
    `;
    container.appendChild(sk);
  }
}

export function renderTraders(container, data, ctx) {
  if (!container) return;
  const items = ctx?.items || null;
  container.innerHTML = "";
  renderBaroVarzia(container, data.voidTrader, { kind: "baro", name: t("tracker.traders.baro"), glyphId: "g-hooded", costLabelKey: "tracker.traders.ducats" }, items);
  renderBaroVarzia(container, data.vaultTrader, { kind: "varzia", name: t("tracker.traders.varzia"), glyphId: "g-gem", costLabelKey: "tracker.traders.aya" }, items);
  renderDarvo(container, data.dailyDeals, items);
  renderNightwaveShop(container, data.nightwave);
}
