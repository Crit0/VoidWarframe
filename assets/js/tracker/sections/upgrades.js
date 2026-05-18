import { t } from "../../i18n.js";
import { buildEventCard, buildEmpty, buildSkeletons } from "./_card.js";

export function renderSkeletons(container, count = 2) {
  buildSkeletons(container, count);
}

function describe(upg) {
  const type = upg.upgradeType || upg.upgrade || "Bonus";
  const op = upg.operation || "";
  const val = upg.operationValue ?? upg.value ?? "";
  return [type, op && `${op} ${val}`].filter(Boolean).join(" ");
}

export function render(container, upgrades) {
  if (!container) return;
  container.innerHTML = "";
  const list = Array.isArray(upgrades) ? upgrades.filter((u) => u && !u.expired) : [];
  if (!list.length) {
    buildEmpty(container, "upgrades.empty");
    return;
  }
  for (const u of list) {
    container.appendChild(buildEventCard({
      kind: "event",
      title: describe(u),
      subtitle: t("upgrades.subtitle"),
      expiry: u.expiry,
      activation: u.activation,
    }));
  }
}
