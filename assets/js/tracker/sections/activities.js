import { t } from "../../i18n.js";

function variantLine(v) {
  const parts = [];
  if (v.missionType) parts.push(v.missionType);
  if (v.node) parts.push(v.node);
  if (v.modifier) parts.push(v.modifier);
  return parts.join(" · ");
}

function makeCard({ kind, title, subtitle, reward, expiry, variants, tagLabel, modifier }) {
  const card = document.createElement("article");
  card.className = `alert-card alert-card--${modifier || kind}`;
  const variantsHtml = (variants || [])
    .map((v) => `<li>${escapeHtml(variantLine(v))}</li>`)
    .join("");
  card.innerHTML = `
    <div class="alert-card__head">
      <span class="alert-card__tag">${tagLabel}</span>
      <span class="alert-card__timer" data-expiry-phrase="${expiry || ""}">—</span>
    </div>
    <h3 class="alert-card__title">${escapeHtml(title)}</h3>
    ${subtitle ? `<div class="alert-card__meta">${escapeHtml(subtitle)}</div>` : ""}
    ${variantsHtml ? `<ul class="activity-variants">${variantsHtml}</ul>` : ""}
    ${reward ? `<div class="alert-card__reward">${escapeHtml(reward)}</div>` : ""}
  `;
  return card;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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

export function renderActivities(container, data, ctx) {
  if (!container) return;
  container.innerHTML = "";
  const s = ctx.settings;
  let added = 0;

  if (s.filters.sortie && data.sortie && !data.sortie.expired) {
    container.appendChild(makeCard({
      kind: "sortie",
      modifier: "sortie",
      title: data.sortie.boss || t("tracker.sections.sortie"),
      subtitle: data.sortie.faction || "",
      reward: data.sortie.rewardPool || "",
      expiry: data.sortie.expiry,
      variants: data.sortie.variants || [],
      tagLabel: t("tracker.sections.sortie"),
    }));
    added++;
  }

  if (s.filters.archon && data.archonHunt && !data.archonHunt.expired) {
    container.appendChild(makeCard({
      kind: "archon",
      modifier: "archon",
      title: data.archonHunt.boss || t("tracker.sections.archon"),
      subtitle: data.archonHunt.faction || "",
      reward: data.archonHunt.rewardPool || t("tracker.sections.archon"),
      expiry: data.archonHunt.expiry,
      variants: data.archonHunt.missions || [],
      tagLabel: t("tracker.sections.archon"),
    }));
    added++;
  }

  if (s.filters.arbitration && data.arbitration && !data.arbitration.expired && data.arbitration.node) {
    container.appendChild(makeCard({
      kind: "arbitration",
      modifier: "arbitration",
      title: `${data.arbitration.node}`,
      subtitle: [data.arbitration.type, data.arbitration.enemy].filter(Boolean).join(" · "),
      reward: t("tracker.sections.arbitration"),
      expiry: data.arbitration.expiry,
      tagLabel: t("tracker.sections.arbitration"),
    }));
    added++;
  }

  if (s.filters.archimedea && data.archimedeas && Array.isArray(data.archimedeas) && data.archimedeas.length) {
    const a = data.archimedeas[0] || {};
    const missions = (a.missions || []).map((m) => ({ missionType: m.missionType, node: m.node }));
    container.appendChild(makeCard({
      kind: "archimedea",
      modifier: "archimedea",
      title: t("tracker.sections.archimedea"),
      subtitle: a.personalModifiers?.[0]?.description || "",
      reward: a.deviation?.description || "",
      expiry: a.expiry,
      variants: missions,
      tagLabel: t("tracker.sections.archimedea"),
    }));
    added++;
  }

  if (s.filters.steelPath && data.steelPath) {
    container.appendChild(makeCard({
      kind: "steelPath",
      modifier: "steelPath",
      title: data.steelPath.currentReward?.name || t("tracker.sections.steelPath"),
      subtitle: t("tracker.sections.steelPath"),
      reward: data.steelPath.currentReward?.cost ? `${data.steelPath.currentReward.cost} Steel Essence` : "",
      expiry: data.steelPath.expiry,
      tagLabel: t("tracker.sections.steelPath"),
    }));
    added++;
  }

  if (!added) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${t("tracker.empty.section")}</div>`;
  }
}
