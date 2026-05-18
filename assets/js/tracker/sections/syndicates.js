import { t } from "../../i18n.js";
import { buildEventCard, buildEmpty, buildSkeletons } from "./_card.js";

export function renderSkeletons(container, count = 3) {
  buildSkeletons(container, count);
}

const SYNDICATE_LABELS = {
  ArbitersSyndicate: "Арбитры",
  CephalonSudaSyndicate: "Цефалон Суда",
  NewLokaSyndicate: "Новая Лока",
  PerrinSequence: "Перриновская Последовательность",
  RedVeilSyndicate: "Красная Вуаль",
  SteelMeridianSyndicate: "Стальной Меридиан",
  Ostrons: "Острон",
  SolarisUnitedSyndicate: "Солярис Юнайтед",
  EntratiSyndicate: "Энтрати",
  KahlSyndicate: "Кэйл",
  HoluvaranaCrystalSyndicate: "Холуварана",
  EventSyndicate: "Событие",
  ZarimanSyndicate: "Зариман",
  Nightwave: "Кошмарная волна",
};

function labelFor(key) {
  return SYNDICATE_LABELS[key] || key || "—";
}

export function render(container, syndicateMissions) {
  if (!container) return;
  container.innerHTML = "";
  if (!Array.isArray(syndicateMissions) || !syndicateMissions.length) {
    buildEmpty(container, "syndicates.empty");
    return;
  }

  for (const item of syndicateMissions) {
    const name = labelFor(item.syndicateKey || item.syndicate);
    const nodes = Array.isArray(item.nodes) ? item.nodes.slice(0, 5) : [];
    container.appendChild(buildEventCard({
      kind: "special",
      title: name,
      subtitle: t("syndicates.subtitle"),
      variants: nodes.map((n) => ({ node: n })),
      expiry: item.expiry,
      activation: item.activation,
    }));
  }
}
