import { t } from "../../i18n.js";
import { buildEventCard, buildEmpty, buildSkeletons } from "./_card.js";
import { translatePool, translateFaction, translateReward } from "../labels.js";

function variantsOf(item) {
  return (item.variants || item.missions || []).map((v) => ({
    missionType: v.missionType,
    node: v.node,
    modifier: v.modifier,
  }));
}

function asRewards(...vals) {
  return vals.filter(Boolean).flatMap((v) => Array.isArray(v) ? v : [v]);
}

export function renderSkeletons(container, count = 3) {
  buildSkeletons(container, count);
}

export function renderActivities(container, data, ctx) {
  if (!container) return;
  container.innerHTML = "";
  const s = ctx.settings;
  let added = 0;

  const push = (entry) => { container.appendChild(buildEventCard(entry)); added++; };

  if (s.filters.sortie && data.sortie && !data.sortie.expired) {
    push({
      kind: "sortie",
      title: data.sortie.boss || t("tracker.sections.sortie"),
      subtitle: translateFaction(data.sortie.faction || ""),
      rewards: asRewards(translatePool(data.sortie.rewardPool)),
      variants: variantsOf(data.sortie),
      expiry: data.sortie.expiry,
      activation: data.sortie.activation,
    });
  }

  if (s.filters.archon && data.archonHunt && !data.archonHunt.expired) {
    push({
      kind: "archonHunt",
      title: data.archonHunt.boss || t("tracker.sections.archon"),
      subtitle: translateFaction(data.archonHunt.faction || ""),
      rewards: asRewards(translatePool(data.archonHunt.rewardPool) || "Archon Shard"),
      variants: variantsOf(data.archonHunt),
      expiry: data.archonHunt.expiry,
      activation: data.archonHunt.activation,
    });
  }

  if (s.filters.arbitration && data.arbitration && !data.arbitration.expired && data.arbitration.node) {
    push({
      kind: "arbitration",
      title: data.arbitration.node,
      subtitle: [data.arbitration.type, data.arbitration.enemy].filter(Boolean).join(" · "),
      rewards: asRewards(translateReward("Vitus Essence"), translateReward("Endo")),
      expiry: data.arbitration.expiry,
      activation: data.arbitration.activation,
    });
  }

  if (s.filters.archimedea && Array.isArray(data.archimedeas)) {
    data.archimedeas.forEach((a) => {
      if (!a) return;
      push({
        kind: "archimedea",
        title: t("tracker.sections.archimedea"),
        subtitle: a.deviation?.description || a.personalModifiers?.[0]?.description || "",
        rewards: asRewards(translateReward("Archon Shard"), "Cascadia Empowered"),
        variants: (a.missions || []).map((m) => ({ missionType: m.missionType, node: m.node })),
        expiry: a.expiry,
        activation: a.activation,
      });
    });
  }

  if (s.filters.steelPath && data.steelPath) {
    push({
      kind: "steelPath",
      title: data.steelPath.currentReward?.name || t("tracker.sections.steelPath"),
      subtitle: t("tracker.sections.steelPath"),
      rewards: data.steelPath.currentReward?.cost ? [translateReward(`${data.steelPath.currentReward.cost} Steel Essence`)] : [],
      expiry: data.steelPath.expiry,
      activation: data.steelPath.activation,
    });
  }

  if (!added) buildEmpty(container);
}
