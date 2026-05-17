import { CONFIG } from "../config.js";

/* Inventory data sources — mods + arcanes + shards.
   Mods/arcanes fetched from api.warframestat.us, cached in localStorage.
   Shards are a small static list (color × stat-slot configuration). */

const MODS_TTL_MS  = 7 * 24 * 3600 * 1000;
const VERSION = 2;  // bumped: mods now have maxStats, no levelStats
const memCache = new Map();
const inflight = new Map();

function cacheKey(kind, lang) { return `vw_${kind}_${lang}_v${VERSION}`; }

function readCache(kind, lang) {
  try {
    const raw = localStorage.getItem(cacheKey(kind, lang));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > MODS_TTL_MS) return null;
    return data;
  } catch { return null; }
}

function writeCache(kind, lang, data) {
  try {
    localStorage.setItem(cacheKey(kind, lang), JSON.stringify({ ts: Date.now(), data }));
  } catch (e) { console.warn(`[VW] ${kind} cache write failed:`, e.message); }
}

async function fetchOnce(kind, url, lang, transform) {
  const memKey = `${kind}_${lang}`;
  if (memCache.has(memKey)) return memCache.get(memKey);
  if (inflight.has(memKey)) return inflight.get(memKey);

  const cached = readCache(kind, lang);
  if (cached) { memCache.set(memKey, cached); return cached; }

  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let arr = Array.isArray(data) ? data : [];
      if (typeof transform === "function") arr = arr.map(transform);
      writeCache(kind, lang, arr);
      memCache.set(memKey, arr);
      return arr;
    } catch (err) {
      console.warn(`[VW] ${kind} fetch failed:`, err);
      memCache.set(memKey, []);
      return [];
    } finally {
      inflight.delete(memKey);
    }
  })();
  inflight.set(memKey, p);
  return p;
}

export function getMods(lang) {
  const url = `${CONFIG.API_BASE}/mods?language=${lang}&only=name,uniqueName,imageName,description,polarity,baseDrain,fusionLimit,type,rarity,compatName,isAugment,levelStats`;
  return fetchOnce("mods", url, lang, slimMod);
}

function slimMod(m) {
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

export function getArcanes(lang) {
  const url = `${CONFIG.API_BASE}/arcanes?language=${lang}`;
  return fetchOnce("arcanes", url, lang);
}

/* ============== Archon shards (static catalog) ============== */

const SHARD_COLORS_RU = {
  crimson:  "Алый",
  amber:    "Янтарный",
  azure:    "Лазурный",
  violet:   "Фиолетовый",
  emerald:  "Изумрудный",
  topaz:    "Топазовый",
};
const SHARD_COLORS_EN = {
  crimson: "Crimson", amber: "Amber", azure: "Azure",
  violet: "Violet", emerald: "Emerald", topaz: "Topaz",
};

const SHARD_STATS = {
  crimson: [
    { ru: "+15% сила способностей",         en: "+15% Ability Strength",       tauforged: "+25%" },
    { ru: "+25% урон в ближнем бою",        en: "+25% Melee Damage",           tauforged: "+37.5%" },
    { ru: "+15% урон оружия",               en: "+15% Primary/Secondary Dmg",  tauforged: "+25%" },
    { ru: "+15% урон против Корпуса",       en: "+15% Damage vs Corpus",       tauforged: "+25%" },
    { ru: "+15% урон против Гринира",       en: "+15% Damage vs Grineer",      tauforged: "+25%" },
    { ru: "+10% шанс крит. урона",          en: "+10% Crit Chance",            tauforged: "+15%" },
  ],
  amber: [
    { ru: "+150 брони",                     en: "+150 Armour",                 tauforged: "+225" },
    { ru: "+25% радиус способностей",       en: "+25% Ability Range",          tauforged: "+37.5%" },
    { ru: "+5 макс. энергии",               en: "+5 Energy Max",               tauforged: "+7.5" },
    { ru: "+15% эффективность брони",       en: "+15% Health Orb Effectiveness", tauforged: "+25%" },
    { ru: "+50% длительность статусов",     en: "+50% Status Duration",        tauforged: "+75%" },
  ],
  azure: [
    { ru: "+150 щита",                      en: "+150 Shield Capacity",        tauforged: "+225" },
    { ru: "+150 здоровья",                  en: "+150 Health",                 tauforged: "+225" },
    { ru: "+25% продолжительность",         en: "+25% Ability Duration",       tauforged: "+37.5%" },
    { ru: "+15% задержка регенерации щита", en: "+15% Shield Recharge Delay",  tauforged: "+25%" },
  ],
  violet: [
    { ru: "+40% урон элементов абилки",     en: "+40% Ability Elemental Dmg",  tauforged: "+60%" },
    { ru: "+30% бонус к шансу крита оружия", en: "+30% Initial Crit Damage",   tauforged: "+45%" },
    { ru: "+40% эффективность абилок",      en: "+40% Ability Efficiency",     tauforged: "+60%" },
  ],
  emerald: [
    { ru: "+30% урон от статусов",          en: "+30% Status Damage",          tauforged: "+45%" },
    { ru: "+15% яд продолжительность",      en: "+15% Toxin DoT duration",     tauforged: "+22.5%" },
    { ru: "+25% длительность энергии",      en: "+25% Energy Orb Duration",    tauforged: "+37.5%" },
  ],
  topaz: [
    { ru: "+60% урон по группе врагов",     en: "+60% Group AoE Damage",       tauforged: "+90%" },
    { ru: "+10% крит. урон с убийств",      en: "+10% Crit Damage on kill",    tauforged: "+15%" },
    { ru: "+50% дроп ресурсов",             en: "+50% Resource Drop Chance",   tauforged: "+75%" },
  ],
};

const SHARD_IMG = {
  crimson:  "https://cdn.warframestat.us/img/archonshardcrimson.png",
  amber:    "https://cdn.warframestat.us/img/archonshardamber.png",
  azure:    "https://cdn.warframestat.us/img/archonshardazure.png",
  violet:   "https://cdn.warframestat.us/img/archonshardviolet.png",
  emerald:  "https://cdn.warframestat.us/img/archonshardemerald.png",
  topaz:    "https://cdn.warframestat.us/img/archonshardtopaz.png",
};

export function getShards(lang) {
  const out = [];
  for (const color of Object.keys(SHARD_STATS)) {
    const colorName = (lang === "ru" ? SHARD_COLORS_RU : SHARD_COLORS_EN)[color];
    SHARD_STATS[color].forEach((stat, i) => {
      // Regular variant
      out.push({
        uniqueName: `shard:${color}:${i}`,
        name: `${colorName} осколок · ${stat[lang] || stat.en}`,
        nameShort: `${colorName} осколок`,
        nameOnly: stat[lang] || stat.en,
        color,
        tauforged: false,
        image: SHARD_IMG[color],
        kind: "shard",
      });
      // Tauforged variant
      out.push({
        uniqueName: `shard:${color}:${i}:tauforged`,
        name: `Тауфорджевый ${colorName.toLowerCase()} · ${stat.tauforged}`,
        nameShort: `${lang === "ru" ? "Тауфорджевый " + colorName.toLowerCase() : "Tauforged " + colorName} осколок`,
        nameOnly: stat.tauforged + (lang === "ru" ? " (тауфорджевый)" : " (Tauforged)"),
        color,
        tauforged: true,
        image: SHARD_IMG[color],
        kind: "shard",
      });
    });
  }
  return out;
}
