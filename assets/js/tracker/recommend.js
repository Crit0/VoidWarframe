export const MISSION_DURATION_MIN = {
  capture: 4, exterminate: 6, sabotage: 7, rescue: 5, spy: 8,
  "mobile defense": 8, mobiledefense: 8,
  defense: 10, interception: 12, survival: 10, excavation: 12,
  disruption: 12, assassination: 8, hijack: 9, defection: 12,
  "infested salvage": 12, arena: 6, rush: 5,
  "free roam": 25, bounty: 25, "open world": 25,
  "void cascade": 15, "void flood": 12, "void armageddon": 12,
  alchemy: 10, "mirror defense": 12,
  sortie: 25, "archon hunt": 30, arbitration: 20,
  "deep archimedea": 30, "steel path circuit": 25, circuit: 25,
  fissure: 10,
};

const MISSION_TYPE_ALIASES = {
  "захват": "capture", "истребление": "exterminate", "саботаж": "sabotage",
  "спасение": "rescue", "шпионаж": "spy", "мобильная оборона": "mobile defense",
  "оборона": "defense", "перехват": "interception", "выживание": "survival",
  "раскопки": "excavation", "разлад": "disruption", "ликвидация": "assassination",
  "захват цели": "hijack", "дезертирство": "defection",
  "извлечение из инфестированных": "infested salvage",
  "арена": "arena", "разведка": "free roam", "вылазка": "bounty",
  "пустотный каскад": "void cascade", "пустотный поток": "void flood",
  "армагеддон бездны": "void armageddon",
  "алхимия": "alchemy", "зеркальная оборона": "mirror defense",
  "забег": "rush",
};

const FALLBACK_MIN = 10;

export function estimateDurationMin(item, opts = {}) {
  if (!item) return FALLBACK_MIN;
  if (opts.kind === "sortie") return scaleByVariants(item, 25);
  if (opts.kind === "archonHunt") return scaleByVariants(item, 30);
  if (opts.kind === "arbitration") return MISSION_DURATION_MIN.arbitration;
  if (opts.kind === "archimedea") return MISSION_DURATION_MIN["deep archimedea"];

  const raw = String(item.missionType || item.type || item.mission?.type || "").toLowerCase().trim();
  if (!raw) return opts.kind === "fissure" ? MISSION_DURATION_MIN.fissure : FALLBACK_MIN;
  const norm = MISSION_TYPE_ALIASES[raw] || raw;
  let mins = MISSION_DURATION_MIN[norm];
  if (mins == null) {
    for (const [k, v] of Object.entries(MISSION_DURATION_MIN)) {
      if (norm.includes(k)) { mins = v; break; }
    }
  }
  if (mins == null) mins = opts.kind === "fissure" ? MISSION_DURATION_MIN.fissure : FALLBACK_MIN;
  if (item.isStorm || item.isHard) mins = Math.round(mins * 1.3);
  return mins;
}

function scaleByVariants(item, base) {
  const v = Array.isArray(item.variants) ? item.variants.length : 0;
  return v > 0 ? base : Math.round(base * 0.6);
}

const VALUABLE_RE = /\b(archon|riven|forma|umbra|steel\s*essence|aya|regal\s*aya|prime|kuva|orokin\s*cell|nitain|legendary\s*core)\b/i;
const VALUABLE_REWARDPOOL_RE = /archon|riven|forma|umbra/i;

export function isValuableReward(item, opts = {}) {
  if (!item) return false;
  if (opts.kind === "sortie" || opts.kind === "archonHunt") return true;
  if (opts.kind === "archimedea" || opts.kind === "arbitration") return true;
  if (opts.kind === "fissure") {
    const tier = String(item.tier || "").toLowerCase();
    return tier === "axi" || tier === "requiem";
  }
  if (opts.kind === "invasion" || opts.kind === "alert" || opts.kind === "event") {
    const rewardStr = collectRewardString(item);
    return VALUABLE_RE.test(rewardStr);
  }
  if (item.rewardPool && VALUABLE_REWARDPOOL_RE.test(item.rewardPool)) return true;
  const rewardStr = collectRewardString(item);
  return VALUABLE_RE.test(rewardStr);
}

function collectRewardString(item) {
  const r = item?.reward || item?.mission?.reward || item;
  const parts = [];
  if (typeof r === "string") parts.push(r);
  if (r?.asString) parts.push(r.asString);
  if (Array.isArray(r?.items)) parts.push(r.items.join(" "));
  if (Array.isArray(r?.countedItems)) parts.push(r.countedItems.map((c) => c.type).join(" "));
  if (Array.isArray(item?.rewards)) parts.push(item.rewards.map((x) => x?.asString || "").join(" "));
  if (item?.rewardPool) parts.push(item.rewardPool);
  return parts.join(" ");
}

import { matchesLootTypes } from "./labels.js";

export function isRecommended(entry, settings) {
  if (!settings?.recommend?.on) return false;

  // Access filter — if user marked this event as unavailable, hide
  const accessKey = entry.kind === "archonHunt" ? "archonHunt" : entry.kind;
  if (settings.access && accessKey in settings.access && !settings.access[accessKey]) return false;

  if (settings.recommend.fits) {
    const budget = settings.budgetMin;
    if (budget != null && entry.durationMin > budget) return false;
  }

  if (settings.recommend.valuable && !entry.valuable) return false;

  // Loot filter
  const loot = settings.loot || {};
  if (loot.onlyRare && !entry.valuable) return false;

  const chosen = loot.types ? Object.entries(loot.types).filter(([, v]) => v).map(([k]) => k) : [];
  if (chosen.length && !matchesLootTypes(entry, chosen)) return false;

  return true;
}

export function scoreEntry(entry, settings) {
  let score = 0;
  if (entry.valuable) score += 100;
  if (entry.kind === "archonHunt") score += 60;
  if (entry.kind === "sortie") score += 50;
  if (entry.kind === "archimedea") score += 45;
  if (entry.kind === "arbitration") score += 30;
  if (entry.kind === "fissure" && /axi|requiem/i.test(entry.raw?.tier || "")) score += 20;
  if (entry.kind === "invasion") score += 10;
  const budget = settings?.budgetMin;
  if (budget != null && entry.durationMin <= budget) {
    score += Math.max(0, 30 - (budget - entry.durationMin));
  }
  const expiryMs = entry.expiry ? new Date(entry.expiry).getTime() - Date.now() : Infinity;
  if (expiryMs < 30 * 60 * 1000 && expiryMs > 0) score += 25;
  return score;
}
