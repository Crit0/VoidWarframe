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
  };
}
