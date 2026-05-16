import { t } from "../../i18n.js";

const SPECIAL_TAGS = new Set([
  "TennoCon", "TennoCon2024", "TennoCon2025", "TennoCon2026",
  "Anniversary", "Anniversary13", "Anniversary14",
  "JadeShadows", "WhispersInTheWalls", "DantePyre",
]);
const SPECIAL_RE = /tennocon|annivers|jubilee|prime\s*resurg|community\s*goal/i;

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function isSpecial(item) {
  if (!item) return false;
  if (SPECIAL_TAGS.has(item.tag)) return true;
  const blob = `${item.tag || ""} ${item.name || ""} ${item.description || ""} ${item.tooltip || ""}`;
  return SPECIAL_RE.test(blob);
}

function alertCard(a, kind) {
  const mission = a.mission || {};
  const tagLabel = kind === "alert" ? t("tracker.sections.alerts") : t("tracker.sections.events");
  const title = [mission.type, mission.node].filter(Boolean).join(" · ") || a.description || t("alerts.unknown");
  const reward = mission.reward?.asString || "";
  return makeCard({
    title,
    subtitle: mission.faction || "",
    reward,
    tagLabel,
    expiry: a.expiry,
    modifier: kind === "alert" ? null : "event",
  });
}

function invasionCard(inv) {
  const r1 = inv.attackerReward?.asString || "";
  const r2 = inv.defenderReward?.asString || "";
  const reward = [r1, r2].filter(Boolean).join("  ↔  ");
  return makeCard({
    title: inv.node || t("tracker.sections.invasions"),
    subtitle: `${inv.attackingFaction || ""} → ${inv.defendingFaction || ""}`.trim(),
    reward,
    tagLabel: t("tracker.sections.invasions"),
    expiry: inv.eta ? null : null,
    modifier: "invasion",
    progress: typeof inv.completion === "number" ? inv.completion : null,
  });
}

function eventCard(ev) {
  const reward = (ev.rewards && ev.rewards[0]?.asString) || "";
  const title = ev.description || ev.name || t("tracker.sections.events");
  const special = isSpecial(ev);
  return makeCard({
    title,
    subtitle: ev.tooltip || ev.node || "",
    reward,
    tagLabel: special ? t("tracker.sections.special") : t("tracker.sections.events"),
    expiry: ev.expiry,
    modifier: special ? "special" : "event",
  });
}

function makeCard({ title, subtitle, reward, tagLabel, expiry, modifier, progress }) {
  const card = document.createElement("article");
  card.className = `alert-card${modifier ? ` alert-card--${modifier}` : ""}`;
  card.innerHTML = `
    <div class="alert-card__head">
      <span class="alert-card__tag">${escapeHtml(tagLabel)}</span>
      ${expiry ? `<span class="alert-card__timer" data-expiry-phrase="${expiry}">—</span>` : ""}
    </div>
    <h3 class="alert-card__title">${escapeHtml(title)}</h3>
    ${subtitle ? `<div class="alert-card__meta">${escapeHtml(subtitle)}</div>` : ""}
    ${reward ? `<div class="alert-card__reward">${escapeHtml(reward)}</div>` : ""}
    ${typeof progress === "number" ? `<div class="invasion-bar"><div class="invasion-bar__fill" style="width:${Math.min(100, Math.max(0, 50 + progress / 2)).toFixed(1)}%"></div></div>` : ""}
  `;
  return card;
}

export function renderSkeletons(container, count = 4) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skel-card";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width:30%"></div>
      <div class="skeleton skel-line" style="width:80%; height:18px"></div>
      <div class="skeleton skel-line" style="width:60%"></div>
    `;
    container.appendChild(sk);
  }
}

export function renderLive(container, data, ctx) {
  if (!container) return;
  const s = ctx.settings;
  container.innerHTML = "";

  const specials = (data.events || []).filter(isSpecial);
  const events = (data.events || []).filter((e) => !isSpecial(e));

  if (s.filters.special && specials.length) {
    specials.forEach((e) => container.appendChild(eventCard(e)));
  }
  if (s.filters.invasions) {
    (data.invasions || []).filter((i) => !i.completed).slice(0, 6).forEach((i) => container.appendChild(invasionCard(i)));
  }
  if (s.filters.alerts) {
    (data.alerts || []).slice(0, 6).forEach((a) => container.appendChild(alertCard(a, "alert")));
  }
  if (s.filters.events) {
    events.slice(0, 6).forEach((e) => container.appendChild(eventCard(e)));
  }

  if (!container.children.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${t("tracker.empty.section")}</div>`;
  }
}
