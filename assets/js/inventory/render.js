import { CONFIG } from "../config.js";
import { t, getLang } from "../i18n.js";
import { isOwned, toggleOwned } from "./state.js";
import { polaritySvg, polarityColor, rarityColor, rarityLabel } from "./polarities.js";
import { categoryOf, matchesTopSub, matchesFamilies, arcaneCategoryOf } from "./categories.js";

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

function statsList(mod) {
  if (!mod.maxStats || !mod.maxStats.length) return "";
  return `<ul class="inv-card__stats">${mod.maxStats.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`;
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
      ${statsList(mod)}
      ${desc ? `<p class="inv-card__desc">${escapeHtml(desc)}</p>` : ""}
      ${mod.wikiaUrl ? `<a class="inv-card__wiki" href="${escapeHtml(mod.wikiaUrl)}" target="_blank" rel="noopener" title="Wiki"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3h7v7M21 3l-9 9M19 14v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6"/></svg>Wiki</a>` : ""}
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

export function filterMods(mods, { topCategory, subCategory, search, polarity, rarity, families, ownedOnly }) {
  const q = (search || "").trim().toLowerCase();
  return mods.filter((m) => {
    if (q && !(m.name || "").toLowerCase().includes(q)) return false;
    const cat = categoryOf(m);
    if (!matchesTopSub(cat, topCategory, subCategory)) return false;
    if (polarity && polarity !== "all" && m.polarity !== polarity) return false;
    if (rarity   && rarity !== "all" && (m.rarity || "").toLowerCase() !== rarity.toLowerCase()) return false;
    if (!matchesFamilies(m, families)) return false;
    if (ownedOnly && !isOwned("mods", m.uniqueName)) return false;
    return true;
  });
}

export function filterArcanes(arcanes, { topCategory, subCategory, search, ownedOnly }) {
  const q = (search || "").trim().toLowerCase();
  return arcanes.filter((a) => {
    if (q && !(a.name || "").toLowerCase().includes(q)) return false;
    const cat = arcaneCategoryOf(a);
    if (!matchesTopSub(cat, topCategory, subCategory)) return false;
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

/* ============== Sorting ============== */

const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, legendary: 3, "обычный": 0, "необычный": 1, "редкий": 2, "легендарный": 3 };
const POLARITY_ORDER = { madurai: 0, naramon: 1, vazarin: 2, zenurik: 3, penjaga: 4, unairu: 5, umbra: 6, aura: 7, universal: 8, "": 99, "?": 99 };
const SHARD_COLOR_ORDER = { crimson: 0, amber: 1, azure: 2, violet: 3, emerald: 4, topaz: 5 };

export function sortItems(items, sort, kind) {
  if (!sort || !sort.key) return items;
  const k = sort.key, d = sort.dir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    let av, bv;
    if (k === "name") {
      av = (a.name || "").toLowerCase();
      bv = (b.name || "").toLowerCase();
    } else if (k === "rarity") {
      av = RARITY_ORDER[(a.rarity || "").toLowerCase()] ?? 99;
      bv = RARITY_ORDER[(b.rarity || "").toLowerCase()] ?? 99;
    } else if (k === "polarity") {
      av = POLARITY_ORDER[a.polarity || ""] ?? 99;
      bv = POLARITY_ORDER[b.polarity || ""] ?? 99;
    } else if (k === "drain") {
      av = a.baseDrain ?? -1;
      bv = b.baseDrain ?? -1;
    } else if (k === "color" && kind === "shards") {
      av = SHARD_COLOR_ORDER[a.color] ?? 99;
      bv = SHARD_COLOR_ORDER[b.color] ?? 99;
    } else if (k === "tauforged" && kind === "shards") {
      av = a.tauforged ? 1 : 0;
      bv = b.tauforged ? 1 : 0;
    } else {
      return 0;
    }
    if (av < bv) return -1 * d;
    if (av > bv) return  1 * d;
    return (a.name || "").localeCompare(b.name || "");
  });
}

/* ============== Grid + pager ============== */

export function renderGrid(container, items, builder, { page = 1, perPage = 60 } = {}) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${escapeHtml(t("inv.empty"))}</div>`;
    return;
  }
  const start = (page - 1) * perPage;
  const slice = items.slice(start, start + perPage);
  const frag = document.createDocumentFragment();
  slice.forEach((it) => frag.appendChild(builder(it)));
  container.appendChild(frag);
}

export function renderPager(container, total, page, perPage, onPage) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) { container.innerHTML = ""; return; }
  const items = [];
  const add = (label, target, current = false, disabled = false) => items.push({ label, target, current, disabled });

  add("‹", Math.max(1, page - 1), false, page === 1);

  const show = new Set([1, pages, page - 1, page, page + 1]);
  let prev = 0;
  for (let i = 1; i <= pages; i++) {
    if (!show.has(i)) continue;
    if (i - prev > 1) items.push({ label: "…", target: 0, current: false, disabled: true });
    add(String(i), i, i === page, false);
    prev = i;
  }

  add("›", Math.min(pages, page + 1), false, page === pages);

  container.innerHTML = items.map((it) =>
    `<button type="button" class="inv-pager__btn${it.current ? " is-current" : ""}" ${it.disabled ? "disabled" : `data-page="${it.target}"`}>${escapeHtml(it.label)}</button>`
  ).join("");

  container.querySelectorAll("[data-page]").forEach((b) =>
    b.addEventListener("click", () => onPage(Number(b.dataset.page))));
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
