import { getLatest, refresh, ApiEvents } from "../api/index.js";
import { bundleTs } from "../api/bundle.js";

/* Inventory data sources — mods, arcanes (via api/) + static archon shards. */

const errors = new Map(); // `${kind}_${lang}` → Error|null

ApiEvents.addEventListener("mods:failed",    (e) => errors.set(`mods_${e.detail.lang}`, e.detail));
ApiEvents.addEventListener("arcanes:failed", (e) => errors.set(`arcanes_${e.detail.lang}`, e.detail));
ApiEvents.addEventListener("mods:updated",   (e) => errors.delete(`mods_${e.detail.lang}`));
ApiEvents.addEventListener("arcanes:updated",(e) => errors.delete(`arcanes_${e.detail.lang}`));

export function getLastFetchError(kind, lang) {
  return errors.get(`${kind}_${lang}`) || null;
}

export async function getMods(lang, opts = {}) {
  if (opts.force) await refresh("mods", lang);
  const r = await getLatest("mods", lang);
  return r.data;
}

export async function getArcanes(lang, opts = {}) {
  if (opts.force) await refresh("arcanes", lang);
  const r = await getLatest("arcanes", lang);
  return r.data;
}

export async function getBundleAge(kind, lang) {
  const ts = await bundleTs(kind, lang);
  return ts == null ? null : Date.now() - ts;
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
