import { t } from "../../i18n.js";
import { buildEventCard, buildEmpty, buildSkeletons } from "./_card.js";

export function renderSkeletons(container, count = 2) {
  buildSkeletons(container, count);
}

function describeProgress(label, pct) {
  return `${label}: ${Math.round(pct)}%`;
}

export function render(container, data) {
  if (!container) return;
  container.innerHTML = "";

  const cards = [];

  // Construction progress (Fomorian / Razorback / Unknown).
  if (data && data.constructionProgress) {
    const c = data.constructionProgress;
    if (Number(c.fomorianProgress) > 0) {
      cards.push({ kind: "event", title: t("calendar.title"),
        subtitle: describeProgress("Fomorian", c.fomorianProgress) });
    }
    if (Number(c.razorbackProgress) > 0) {
      cards.push({ kind: "event", title: t("calendar.title"),
        subtitle: describeProgress("Razorback", c.razorbackProgress) });
    }
  }

  // Calendar from API (if present).
  if (data && Array.isArray(data.calendar)) {
    for (const e of data.calendar.slice(0, 4)) {
      cards.push({
        kind: "event",
        title: e.title || e.day || "Event",
        subtitle: (e.events || []).map((x) => x.type || x.title).join(" · ") || t("calendar.subtitle"),
        expiry: e.endDate || e.activation,
      });
    }
  }

  if (!cards.length) {
    buildEmpty(container, "calendar.empty");
    return;
  }
  for (const entry of cards) container.appendChild(buildEventCard(entry));
}
