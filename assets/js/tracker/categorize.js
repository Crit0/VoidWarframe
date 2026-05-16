import { t } from "../i18n.js";

const IMPORTANT_KINDS = new Set(["sortie", "archonHunt", "archimedea", "special"]);
const URGENT_MS = 2 * 60 * 60 * 1000;
const NEW_MS = 3 * 60 * 60 * 1000;

export function statusOf(entry) {
  if (!entry) return "active";
  if (IMPORTANT_KINDS.has(entry.kind)) return "important";
  const now = Date.now();
  if (entry.expiry) {
    const left = new Date(entry.expiry).getTime() - now;
    if (left > 0 && left < URGENT_MS) return "urgent";
  }
  if (entry.activation) {
    const age = now - new Date(entry.activation).getTime();
    if (age >= 0 && age < NEW_MS) return "new";
  }
  return "active";
}

export function statusLabel(status) {
  return t(`tracker.status.${status}`);
}

const TYPE_LABEL_KEY = {
  sortie: "tracker.eventType.daily",
  archonHunt: "tracker.eventType.weekly",
  arbitration: "tracker.eventType.arbitration",
  archimedea: "tracker.eventType.weeklyDeep",
  steelPath: "tracker.eventType.weekly",
  invasion: "tracker.eventType.invasion",
  alert: "tracker.eventType.alert",
  event: "tracker.eventType.operation",
  special: "tracker.eventType.special",
  fissure: "tracker.eventType.fissure",
  nightwave: "tracker.eventType.nightwave",
};

export function typeLabel(kind) {
  const key = TYPE_LABEL_KEY[kind];
  return key ? t(key) : t("tracker.eventType.event");
}

export function artClassOf(kind, tier) {
  if (kind === "fissure" && tier) return `event-art--fissure-${String(tier).toLowerCase()}`;
  if (kind === "archonHunt") return "event-art--archon";
  return `event-art--${kind}`;
}

export function typeClassOf(kind) {
  if (kind === "archonHunt") return "event-type--archon";
  return `event-type--${kind}`;
}

export function glyphOf(kind, tier) {
  if (kind === "fissure") {
    if (String(tier).toLowerCase() === "requiem" || String(tier).toLowerCase() === "реквием") return "g-rune";
    return "g-relic";
  }
  return {
    sortie: "g-sword",
    archonHunt: "g-crystal",
    arbitration: "g-shield",
    archimedea: "g-beaker",
    steelPath: "g-broken",
    invasion: "g-clash",
    alert: "g-alert",
    event: "g-star",
    special: "g-crown",
    nightwave: "g-wave",
  }[kind] || "g-star";
}
