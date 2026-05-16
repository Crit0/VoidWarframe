import { CONFIG } from "../../config.js";
import { t } from "../../i18n.js";
import { estimateDurationMin, isValuableReward, isRecommended, scoreEntry } from "../recommend.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function entryFromSortie(s) {
  if (!s || s.expired) return null;
  return {
    kind: "sortie",
    title: s.boss || t("tracker.sections.sortie"),
    subtitle: s.faction || "",
    reward: s.rewardPool || "",
    expiry: s.expiry,
    durationMin: estimateDurationMin(s, { kind: "sortie" }),
    valuable: isValuableReward(s, { kind: "sortie" }),
    raw: s,
  };
}

function entryFromArchon(a) {
  if (!a || a.expired) return null;
  return {
    kind: "archonHunt",
    title: a.boss || t("tracker.sections.archon"),
    subtitle: a.faction || "",
    reward: a.rewardPool || t("tracker.sections.archon"),
    expiry: a.expiry,
    durationMin: estimateDurationMin(a, { kind: "archonHunt" }),
    valuable: true,
    raw: a,
  };
}

function entryFromArbitration(a) {
  if (!a || a.expired || !a.node) return null;
  return {
    kind: "arbitration",
    title: a.node,
    subtitle: [a.type, a.enemy].filter(Boolean).join(" · "),
    reward: t("tracker.sections.arbitration"),
    expiry: a.expiry,
    durationMin: estimateDurationMin(a, { kind: "arbitration" }),
    valuable: true,
    raw: a,
  };
}

function entryFromArchimedea(a) {
  if (!a) return null;
  return {
    kind: "archimedea",
    title: t("tracker.sections.archimedea"),
    subtitle: a.deviation?.description || "",
    reward: "",
    expiry: a.expiry,
    durationMin: estimateDurationMin(a, { kind: "archimedea" }),
    valuable: true,
    raw: a,
  };
}

function entryFromFissure(f) {
  return {
    kind: "fissure",
    title: `${f.node || ""}`,
    subtitle: `${f.tier || ""} · ${f.missionType || ""}${f.isHard ? " · " + t("tracker.fissures.hard") : ""}`,
    reward: "",
    expiry: f.expiry,
    durationMin: estimateDurationMin(f, { kind: "fissure" }),
    valuable: isValuableReward(f, { kind: "fissure" }),
    raw: f,
  };
}

function entryFromInvasion(i) {
  if (!i || i.completed) return null;
  return {
    kind: "invasion",
    title: i.node || t("tracker.sections.invasions"),
    subtitle: `${i.attackingFaction || ""} → ${i.defendingFaction || ""}`.trim(),
    reward: [i.attackerReward?.asString, i.defenderReward?.asString].filter(Boolean).join("  ↔  "),
    expiry: null,
    durationMin: estimateDurationMin(i),
    valuable: isValuableReward(i, { kind: "invasion" }),
    raw: i,
  };
}

function entryFromAlert(a) {
  if (!a) return null;
  return {
    kind: "alert",
    title: [a.mission?.type, a.mission?.node].filter(Boolean).join(" · ") || t("alerts.unknown"),
    subtitle: a.mission?.faction || "",
    reward: a.mission?.reward?.asString || "",
    expiry: a.expiry,
    durationMin: estimateDurationMin(a.mission),
    valuable: isValuableReward(a, { kind: "alert" }),
    raw: a,
  };
}

export function collectEntries(data) {
  const list = [];
  const push = (e) => { if (e) list.push(e); };

  push(entryFromSortie(data.sortie));
  push(entryFromArchon(data.archonHunt));
  push(entryFromArbitration(data.arbitration));
  if (Array.isArray(data.archimedeas)) data.archimedeas.forEach((a) => push(entryFromArchimedea(a)));
  (data.fissures || []).forEach((f) => push(entryFromFissure(f)));
  (data.invasions || []).forEach((i) => push(entryFromInvasion(i)));
  (data.alerts || []).forEach((a) => push(entryFromAlert(a)));
  return list;
}

function renderCard(entry) {
  const card = document.createElement("article");
  const valClass = entry.valuable ? " alert-card--special" : "";
  card.className = `alert-card alert-card--${entry.kind}${valClass}`;
  card.innerHTML = `
    <div class="alert-card__head">
      <span class="alert-card__tag">${escapeHtml(t(`tracker.sections.${kindToSectionKey(entry.kind)}`))}</span>
      <span class="alert-card__local">~${entry.durationMin}m</span>
    </div>
    <h3 class="alert-card__title">${escapeHtml(entry.title)}</h3>
    ${entry.subtitle ? `<div class="alert-card__meta">${escapeHtml(entry.subtitle)}</div>` : ""}
    ${entry.reward ? `<div class="alert-card__reward">${escapeHtml(entry.reward)}</div>` : ""}
    ${entry.expiry ? `<div class="alert-card__timer" data-expiry-phrase="${entry.expiry}">—</div>` : ""}
  `;
  return card;
}

function kindToSectionKey(kind) {
  if (kind === "archonHunt") return "archon";
  return kind === "alert" ? "alerts"
    : kind === "fissure" ? "fissures"
    : kind === "invasion" ? "invasions"
    : kind;
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

export function renderRecommended(container, data, ctx) {
  if (!container) return;
  const settings = ctx.settings;
  if (!settings.recommend.on) {
    container.innerHTML = "";
    return;
  }
  const entries = collectEntries(data);
  const filtered = entries.filter((e) => isRecommended(e, settings));
  filtered.sort((a, b) => scoreEntry(b, settings) - scoreEntry(a, settings));
  const top = filtered.slice(0, CONFIG.RECOMMEND_LIMIT);
  container.innerHTML = "";
  if (!top.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${t("tracker.recommend.none")}</div>`;
    return;
  }
  top.forEach((e) => container.appendChild(renderCard(e)));
}
