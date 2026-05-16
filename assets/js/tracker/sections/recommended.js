import { CONFIG } from "../../config.js";
import { t } from "../../i18n.js";
import { estimateDurationMin, isValuableReward, isRecommended, scoreEntry } from "../recommend.js";
import { buildEventCard, buildEmpty, escapeHtml } from "./_card.js";

function entryFromSortie(s) {
  if (!s || s.expired) return null;
  return {
    kind: "sortie",
    title: s.boss || t("tracker.sections.sortie"),
    subtitle: s.faction || "",
    rewards: [s.rewardPool].filter(Boolean),
    expiry: s.expiry,
    activation: s.activation,
    durationMin: estimateDurationMin(s, { kind: "sortie" }),
    valuable: true,
    raw: s,
  };
}

function entryFromArchon(a) {
  if (!a || a.expired) return null;
  return {
    kind: "archonHunt",
    title: a.boss || t("tracker.sections.archon"),
    subtitle: a.faction || "",
    rewards: [a.rewardPool || "Archon Shard"],
    expiry: a.expiry,
    activation: a.activation,
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
    rewards: ["Vitus Essence"],
    expiry: a.expiry,
    activation: a.activation,
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
    rewards: ["Archon Shard"],
    expiry: a.expiry,
    activation: a.activation,
    durationMin: estimateDurationMin(a, { kind: "archimedea" }),
    valuable: true,
    raw: a,
  };
}

function entryFromFissure(f) {
  return {
    kind: "fissure",
    tier: f.tier,
    title: f.node || "",
    subtitle: [f.tier, f.missionType, f.isHard ? t("tracker.fissures.hard") : null].filter(Boolean).join(" · "),
    rewards: [f.tier],
    expiry: f.expiry,
    activation: f.activation,
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
    subtitle: `${i.attackingFaction || ""} ↔ ${i.defendingFaction || ""}`,
    rewards: [i.attackerReward?.asString, i.defenderReward?.asString].filter(Boolean),
    activation: i.activation,
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
    rewards: [a.mission?.reward?.asString].filter(Boolean),
    expiry: a.expiry,
    activation: a.activation,
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

export function renderSkeletons(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="skel-card" style="grid-column:1/-1; min-height:90px">
      <div class="skeleton skel-line" style="width:30%"></div>
      <div class="skeleton skel-line" style="width:60%; height:18px"></div>
      <div class="skeleton skel-line" style="width:40%"></div>
    </div>
  `;
}

export function renderHighlight(container, data, ctx) {
  if (!container) return;
  const settings = ctx.settings;
  if (!settings.recommend.on) {
    container.innerHTML = "";
    container.hidden = true;
    return;
  }
  container.hidden = false;
  const entries = collectEntries(data);
  const filtered = entries.filter((e) => isRecommended(e, settings));
  filtered.sort((a, b) => scoreEntry(b, settings) - scoreEntry(a, settings));
  const best = filtered[0];

  if (!best) {
    container.innerHTML = `
      <div class="recommend-highlight" role="region" aria-label="${escapeHtml(t("tracker.recommend.highlight.label"))}">
        <span class="recommend-highlight__icon"><svg><use href="#g-clock"/></svg></span>
        <div>
          <div class="recommend-highlight__label">${escapeHtml(t("tracker.recommend.highlight.label"))}</div>
          <div class="recommend-highlight__title">${escapeHtml(t("tracker.recommend.none"))}</div>
        </div>
        <span></span>
      </div>
    `;
    return;
  }

  const budget = settings.budgetMin;
  const youHave = budget == null
    ? t("tracker.recommend.highlight.youHaveInf")
    : t("tracker.recommend.highlight.youHave", { n: budget });

  container.innerHTML = `
    <div class="recommend-highlight" role="region" aria-label="${escapeHtml(t("tracker.recommend.highlight.label"))}">
      <span class="recommend-highlight__icon"><svg><use href="#g-clock"/></svg></span>
      <div>
        <div class="recommend-highlight__label">${escapeHtml(youHave)}</div>
        <h3 class="recommend-highlight__title">${escapeHtml(best.title)}</h3>
        <div class="recommend-highlight__meta">~${best.durationMin}m · ${escapeHtml(best.subtitle || "")}</div>
      </div>
      <button type="button" class="recommend-highlight__btn">
        ${escapeHtml(t("tracker.recommend.highlight.btn"))}
      </button>
    </div>
  `;
}

// Backwards-compat alias: old API
export const renderRecommended = renderHighlight;
