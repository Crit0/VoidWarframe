/* Map an API mod's compatName + type to a composite UI category
   ("weapons.primary", "archwing.odante", "warframe", ...) and detect
   mod families (Prime/Archon/Galvanized/Amalgam/Umbra/Requiem/...). */

const COMPAT_PRIMARY  = new Set(["Rifle", "Shotgun", "Sniper", "Bow", "Assault Rifle", "PRIMARY", "Tome", "Speargun"]);
const COMPAT_SECONDARY= new Set(["Pistol"]);
const COMPAT_MELEE    = new Set([
  "Melee", "Claws", "Thrown Melee", "Heavy Blade", "Polearm", "Dual Daggers",
  "Daggers", "Nunchaku", "Whip", "Tonfa", "Glaives", "Glaive",
  "Hammer", "Staves", "Two-Handed Nikana", "Nikana", "Rapier", "Scythe",
  "Sword and Shield", "Warfan", "Dual Swords", "Dual Nikana", "Sparring",
  "Machete", "Sword", "Gunblade",
]);
const COMPAT_COMPANION = new Set(["COMPANION", "Sentinel", "BEAST", "Hound", "Moa", "Kavat", "Kubrow", "ROBOTIC", "Beast"]);
const COMPAT_ARCH_GUN  = new Set(["Archgun", "Arch-Gun"]);
const COMPAT_ARCH_MELEE= new Set(["Archmelee", "Arch-Melee"]);
const COMPAT_ARCHWING  = new Set(["Archwing"]);
const COMPAT_NECRAMECH = new Set(["Necramech"]);

const WARFRAME_NAMES = new Set([
  "Trinity","Volt","Excalibur","Nezha","Mag","Loki","Ash","Atlas","Banshee","Baruuk",
  "Caliban","Chroma","Citrine","Cyte-09","Dagath","Dante","Ember","Equinox","Frost",
  "Gara","Garuda","Gauss","Grendel","Gyre","Harrow","Hildryn","Hydroid","Inaros",
  "Ivara","Jade","Khora","Kullervo","Lavos","Limbo","Mesa","Mirage","Nekros","Nidus",
  "Nova","Nyx","Oberon","Octavia","Protea","Qorvex","Revenant","Rhino","Saryn","Sevagoth",
  "Styanax","Titania","Valkyr","Vauban","Voruna","Wisp","Wukong","Xaku","Yareli","Zephyr",
  "Koumei","Temple","Amanata",
]);

export function categoryOf(mod) {
  const c = mod?.compatName || "";
  const t = mod?.type || "";

  if (WARFRAME_NAMES.has(c) || c === "WARFRAME" || t === "Warframe Mod" || t === "Aura Mod" || c === "AURA")
    return "warframe";

  if (COMPAT_ARCH_GUN.has(c)   || /Arch-?Gun/i.test(t))   return "archwing.primary";
  if (COMPAT_ARCH_MELEE.has(c) || /Arch-?Melee/i.test(t)) return "archwing.melee";
  if (COMPAT_ARCHWING.has(c)   || /^Archwing/i.test(t))   return "archwing.odante";

  if (COMPAT_PRIMARY.has(c)    || /^(Primary|Rifle|Shotgun|Sniper|Bow)/i.test(t)) return "weapons.primary";
  if (COMPAT_SECONDARY.has(c)  || /^(Secondary|Pistol)/i.test(t)) return "weapons.secondary";
  if (COMPAT_MELEE.has(c)      || /^(Melee|Stance)/i.test(t))    return "weapons.melee";

  if (COMPAT_COMPANION.has(c)  || /^(Companion|Sentinel)/i.test(t)) return "companion";
  if (COMPAT_NECRAMECH.has(c)  || /^Necramech/i.test(t)) return "other.necramech";
  return "other";
}

export function matchesTopSub(category, top, sub) {
  if (!top || top === "all") return true;
  if (!sub) {
    return category === top || category.startsWith(top + ".");
  }
  return category === `${top}.${sub}`;
}

/* ============== Mod family detection ============== */

const FAMILY_RULES = [
  { tag: "prime",      re: /^(Primed\s|Прайм)/i },
  { tag: "archon",     re: /^(Archon\s|Архон)/i },
  { tag: "galvanized", re: /^(Galvanized\s|Гальв)/i },
  { tag: "amalgam",    re: /^(Amalgam\s|Амальгам)/i },
  { tag: "umbra",      re: /(Umbra|Умбр)/i },
];

export function familiesOf(mod) {
  const tags = new Set();
  const name = mod.name || "";
  const type = mod.type || "";
  for (const r of FAMILY_RULES) if (r.re.test(name)) tags.add(r.tag);
  if (type === "Requiem Mod") tags.add("requiem");
  if (mod.isAugment) tags.add("augment");
  if (type === "Stance Mod") tags.add("stance");
  if (type === "Aura Mod" || mod.polarity === "aura") tags.add("aura");
  if (type.includes("Riven")) tags.add("riven");
  return tags;
}

export function matchesFamilies(mod, chosen) {
  if (!chosen || !chosen.length) return true;
  const have = familiesOf(mod);
  return chosen.some((t) => have.has(t));
}

/* ============== Arcane categorisation (name-based heuristics) ============== */

const PRIMARY_ARCANE   = /^(Primary\s)/i;
const SECONDARY_ARCANE = /^(Secondary\s|Pax\s)/i;
const MELEE_ARCANE     = /^(Melee\s|Exodia\s)/i;
const OPERATOR_ARCANE  = /^(Magus\s|Virtuos\s|Aerial|Tandem|Cascadia)/i;
const ARCHGUN_ARCANE   = /Archgun|Arch-?Gun/i;
const ARCHWING_ARCANE  = /Archwing/i;

export function arcaneCategoryOf(arcane) {
  const name = arcane.name || "";
  if (PRIMARY_ARCANE.test(name))   return "weapons.primary";
  if (SECONDARY_ARCANE.test(name)) return "weapons.secondary";
  if (MELEE_ARCANE.test(name))     return "weapons.melee";
  if (ARCHGUN_ARCANE.test(name))   return "archwing.primary";
  if (ARCHWING_ARCANE.test(name))  return "archwing.odante";
  if (OPERATOR_ARCANE.test(name))  return "other";
  if (/^Arcane\s/i.test(name))     return "warframe";
  return "other";
}

/* ============== Top categories used by inventory.html (mods + arcanes) ============== */

export const MOD_TOP_CATEGORIES = ["all", "weapons", "warframe", "archwing", "companion", "other"];
export const ARCANE_TOP_CATEGORIES = ["all", "weapons", "warframe", "archwing", "other"];

export const SUBCATEGORIES_BY_TOP = {
  weapons:  ["primary", "secondary", "melee"],
  archwing: ["odante", "primary", "melee"],
  other:    ["necramech", "other"],
};
