import { t } from "../../i18n.js";
import { buildEventCard, buildEmpty } from "./_card.js";

const SPECIAL_TAGS = new Set([
  "TennoCon", "TennoCon2024", "TennoCon2025", "TennoCon2026",
  "Anniversary", "Anniversary13", "Anniversary14",
  "JadeShadows", "WhispersInTheWalls", "DantePyre",
]);
const SPECIAL_RE = /tennocon|annivers|jubilee|prime\s*resurg|community\s*goal/i;

export function isSpecial(item) {
  if (!item) return false;
  if (SPECIAL_TAGS.has(item.tag)) return true;
  const blob = `${item.tag || ""} ${item.name || ""} ${item.description || ""} ${item.tooltip || ""}`;
  return SPECIAL_RE.test(blob);
}

function entryFromAlert(a) {
  const m = a.mission || {};
  return {
    kind: "alert",
    title: [m.type, m.node].filter(Boolean).join(" · ") || t("alerts.unknown"),
    subtitle: m.faction || "",
    rewards: [m.reward?.asString].filter(Boolean),
    expiry: a.expiry,
    activation: a.activation,
  };
}

function entryFromInvasion(inv) {
  const r1 = inv.attackerReward?.asString || "";
  const r2 = inv.defenderReward?.asString || "";
  return {
    kind: "invasion",
    title: inv.node || t("tracker.sections.invasions"),
    subtitle: `${inv.attackingFaction || ""} ↔ ${inv.defendingFaction || ""}`,
    rewards: [r1, r2].filter(Boolean),
    activation: inv.activation,
  };
}

function entryFromEvent(ev) {
  const reward = (ev.rewards && ev.rewards[0]?.asString) || "";
  const special = isSpecial(ev);
  return {
    kind: special ? "special" : "event",
    title: ev.description || ev.name || t("tracker.sections.events"),
    subtitle: ev.tooltip || ev.node || "",
    rewards: reward ? [reward] : [],
    expiry: ev.expiry,
    activation: ev.activation,
  };
}

export function renderSkeletons(container, count = 3) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skel-card";
    sk.style.minHeight = "120px";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width:30%"></div>
      <div class="skeleton skel-line" style="width:70%; height:18px"></div>
      <div class="skeleton skel-line" style="width:50%"></div>
    `;
    container.appendChild(sk);
  }
}

export function renderLive(container, data, ctx) {
  if (!container) return;
  container.innerHTML = "";
  const s = ctx.settings;
  const list = document.createElement("div");
  list.className = "events-list";
  let added = 0;

  const specials = (data.events || []).filter(isSpecial);
  const events = (data.events || []).filter((e) => !isSpecial(e));

  if (s.filters.special) specials.forEach((e) => { list.appendChild(buildEventCard(entryFromEvent(e))); added++; });
  if (s.filters.events)  events.slice(0, 4).forEach((e) => { list.appendChild(buildEventCard(entryFromEvent(e))); added++; });
  if (s.filters.invasions) {
    (data.invasions || []).filter((i) => !i.completed).slice(0, 4).forEach((i) => { list.appendChild(buildEventCard(entryFromInvasion(i))); added++; });
  }
  if (s.filters.alerts) {
    (data.alerts || []).slice(0, 4).forEach((a) => { list.appendChild(buildEventCard(entryFromAlert(a))); added++; });
  }

  if (!added) buildEmpty(container);
  else container.appendChild(list);
}
