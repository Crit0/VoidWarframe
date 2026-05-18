/* Per-kind data transforms (run once on raw API response, store transformed). */

export function slimMod(m) {
  const ls = Array.isArray(m.levelStats) && m.levelStats.length
    ? (m.levelStats[m.levelStats.length - 1].stats || [])
    : [];
  return {
    name: m.name,
    uniqueName: m.uniqueName,
    imageName: m.imageName,
    description: m.description,
    polarity: m.polarity,
    baseDrain: m.baseDrain,
    fusionLimit: m.fusionLimit,
    type: m.type,
    rarity: m.rarity,
    compatName: m.compatName,
    isAugment: m.isAugment,
    maxStats: ls,
    incompatibleMods: Array.isArray(m.incompatibleMods) ? m.incompatibleMods : [],
    transmutable: m.transmutable !== false,
    availability: m.availability || null,
    wikiaUrl: m.wikiaUrl || null,
  };
}

export function transform(kind, raw) {
  if (kind === "mods") {
    if (!Array.isArray(raw)) return [];
    if (raw.length && raw[0] && raw[0].maxStats !== undefined) return raw;
    return raw.map(slimMod);
  }
  if (kind === "arcanes" || kind === "items") {
    return Array.isArray(raw) ? raw : [];
  }
  return raw;
}
