import { CONFIG } from "../config.js";
import { t, getLang } from "../i18n.js";
import { isOwned, toggleOwned } from "./state.js";
import { polaritySvg, polarityColor, rarityColor, rarityLabel } from "./polarities.js";
import { categoryOf, matchesTop } from "./categories.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function modImageUrl(mod) {
  if (!mod) return null;
  if (mod.image) return mod.image;
  if (mod.thumbnail) return mod.thumbnail;
  if (mod.imageName) return `${CONFIG.CDN_IMG}${mod.imageName}`;
  return null;
}

function descriptionText(mod) {
  const d = mod.description || mod.effect;
  if (!d) return "";
  if (Array.isArray(d)) return d.join(" · ");
  return String(d);
}

/* ============== Card builders ============== */

export function buildModCard(mod) {
  const owned = isOwned("mods", mod.uniqueName);
  const img = modImageUrl(mod);
  const polar = mod.polarity && mod.polarity !== "?" ? mod.polarity : null;
  const polColor = polar ? polarityColor(polar) : null;
  const rarColor = rarityColor(mod.rarity);
  const desc = descriptionText(mod);

  const el = document.createElement("article");
  el.className = `inv-card${owned ? " is-owned" : ""}`;
  el.dataset.kind = "mods";
  el.dataset.uniqueName = mod.uniqueName;
  el.dataset.polarity = polar || "";
  el.innerHTML = `
    <div class="inv-card__art" aria-hidden="true">
      ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async" onerror="this.removeAttribute('src')">` : ""}
      <span class="inv-card__rarity" style="background:${rarColor};color:#000">${escapeHtml(rarityLabel(mod.rarity, getLang()))}</span>
      ${polar ? `<span class="inv-card__polarity" style="color:${polColor};border-color:${polColor}" title="${escapeHtml(polar)}">${polaritySvg(polar)}</span>` : ""}
    </div>
    <div class="inv-card__body">
      <h3 class="inv-card__name">${escapeHtml(mod.name || "")}</h3>
      <div class="inv-card__meta">
        ${mod.baseDrain != null ? `<span class="inv-card__chip"><svg class="inv-chip-icon"><use href="#g-diamond"/></svg>${mod.baseDrain}</span>` : ""}
        ${mod.compatName && mod.compatName !== "?" ? `<span class="inv-card__chip inv-card__chip--ghost">${escapeHtml(mod.compatName)}</span>` : ""}
        ${mod.isAugment ? `<span class="inv-card__chip inv-card__chip--accent">${escapeHtml(t("inv.tag.augment"))}</span>` : ""}
      </div>
      ${desc ? `<p class="inv-card__desc">${escapeHtml(desc)}</p>` : ""}
    </div>
    <button type="button" class="inv-card__toggle" aria-pressed="${owned}" data-toggle>
      <svg viewBox="0 0 24 24" aria-hidden="true">${owned
        ? `<path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`}
      </svg>
      <span>${escapeHtml(t(owned ? "inv.owned" : "inv.add"))}</span>
    </button>
  `;
  return el;
}

export function buildArcaneCard(a) {
  const owned = isOwned("arcanes", a.name);
  const img = modImageUrl(a);
  const rarColor = rarityColor(a.rarity);
  const desc = descriptionText(a);

  const el = document.createElement("article");
  el.className = `inv-card inv-card--arcane${owned ? " is-owned" : ""}`;
  el.dataset.kind = "arcanes";
  el.dataset.uniqueName = a.name;
  el.innerHTML = `
    <div class="inv-card__art inv-card__art--arcane" aria-hidden="true">
      ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async" onerror="this.removeAttribute('src')">` : ""}
      <span class="inv-card__rarity" style="background:${rarColor};color:#000">${escapeHtml(a.rarity || "")}</span>
    </div>
    <div class="inv-card__body">
      <h3 class="inv-card__name">${escapeHtml(a.name || "")}</h3>
      <div class="inv-card__meta">
        <span class="inv-card__chip inv-card__chip--accent">${escapeHtml(t("inv.tag.arcane"))}</span>
        ${a.location ? `<span class="inv-card__chip inv-card__chip--ghost">${escapeHtml(a.location)}</span>` : ""}
      </div>
      ${desc ? `<p class="inv-card__desc">${escapeHtml(desc)}</p>` : ""}
    </div>
    <button type="button" class="inv-card__toggle" aria-pressed="${owned}" data-toggle>
      <svg viewBox="0 0 24 24" aria-hidden="true">${owned
        ? `<path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`}
      </svg>
      <span>${escapeHtml(t(owned ? "inv.owned" : "inv.add"))}</span>
    </button>
  `;
  return el;
}

export function buildShardCard(s) {
  const owned = isOwned("shards", s.uniqueName);
  const el = document.createElement("article");
  el.className = `inv-card inv-card--shard inv-card--shard-${s.color}${owned ? " is-owned" : ""}${s.tauforged ? " is-tauforged" : ""}`;
  el.dataset.kind = "shards";
  el.dataset.uniqueName = s.uniqueName;
  el.innerHTML = `
    <div class="inv-card__art inv-card__art--shard" aria-hidden="true">
      ${s.image ? `<img src="${escapeHtml(s.image)}" alt="" loading="lazy" onerror="this.removeAttribute('src')">` : ""}
      ${s.tauforged ? `<span class="inv-card__rarity" style="background:#ffd75a;color:#000">${escapeHtml(t("inv.tag.tauforged"))}</span>` : ""}
    </div>
    <div class="inv-card__body">
      <h3 class="inv-card__name">${escapeHtml(s.nameShort || s.name)}</h3>
      <p class="inv-card__desc">${escapeHtml(s.nameOnly || "")}</p>
      <div class="inv-card__meta">
        <span class="inv-card__chip inv-card__chip--accent">${escapeHtml(t("inv.tag.shard"))}</span>
      </div>
    </div>
    <button type="button" class="inv-card__toggle" aria-pressed="${owned}" data-toggle>
      <svg viewBox="0 0 24 24" aria-hidden="true">${owned
        ? `<path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`}
      </svg>
      <span>${escapeHtml(t(owned ? "inv.owned" : "inv.add"))}</span>
    </button>
  `;
  return el;
}

/* ============== Filtering ============== */

export function filterMods(mods, { topCategory, subCategory, search, polarity, rarity, ownedOnly }) {
  const q = (search || "").trim().toLowerCase();
  return mods.filter((m) => {
    if (q && !(m.name || "").toLowerCase().includes(q)) return false;
    const cat = categoryOf(m);
    if (subCategory && cat !== subCategory) return false;
    else if (topCategory && !matchesTop(cat, topCategory)) return false;
    if (polarity && polarity !== "all" && m.polarity !== polarity) return false;
    if (rarity   && rarity !== "all" && (m.rarity || "").toLowerCase() !== rarity.toLowerCase()) return false;
    if (ownedOnly && !isOwned("mods", m.uniqueName)) return false;
    return true;
  });
}

export function filterArcanes(arcanes, { search, ownedOnly }) {
  const q = (search || "").trim().toLowerCase();
  return arcanes.filter((a) => {
    if (q && !(a.name || "").toLowerCase().includes(q)) return false;
    if (ownedOnly && !isOwned("arcanes", a.name)) return false;
    return true;
  });
}

export function filterShards(shards, { search, color, tauforged, ownedOnly }) {
  const q = (search || "").trim().toLowerCase();
  return shards.filter((s) => {
    if (q && !(s.name || "").toLowerCase().includes(q)) return false;
    if (color && color !== "all" && s.color !== color) return false;
    if (tauforged === "yes" && !s.tauforged) return false;
    if (tauforged === "no" && s.tauforged) return false;
    if (ownedOnly && !isOwned("shards", s.uniqueName)) return false;
    return true;
  });
}

/* ============== Grid renderers ============== */

export function renderGrid(container, items, builder, { limit = 60 } = {}) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${escapeHtml(t("inv.empty"))}</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  items.slice(0, limit).forEach((it) => frag.appendChild(builder(it)));
  container.appendChild(frag);
  if (items.length > limit) {
    const more = document.createElement("div");
    more.className = "inv-more";
    more.style.gridColumn = "1/-1";
    more.textContent = t("inv.more", { n: items.length - limit });
    container.appendChild(more);
  }
}

/* ============== Click delegation ============== */

export function attachToggleHandler(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle]");
    if (!btn) return;
    const card = btn.closest(".inv-card");
    if (!card) return;
    e.stopPropagation();
    const kind = card.dataset.kind;
    const uniqueName = card.dataset.uniqueName;
    toggleOwned(kind, uniqueName);
    const pressed = btn.getAttribute("aria-pressed") === "true";
    const next = !pressed;
    btn.setAttribute("aria-pressed", String(next));
    card.classList.toggle("is-owned", next);
    btn.querySelector("span").textContent = t(next ? "inv.owned" : "inv.add");
    btn.querySelector("svg").innerHTML = next
      ? `<path d="M5 13l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  });
}
