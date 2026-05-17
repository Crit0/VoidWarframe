/* Map an API mod's compatName + type to a UI category tree.
   Used for the inventory page's category tabs. */

export const CATEGORY_KEYS = [
  "all", "warframe", "primary", "secondary", "melee",
  "archwing", "archgun", "archmelee",
  "companion", "necramech", "other",
];

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

// Warframe-name compatNames (specific frame names for augments)
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

  if (WARFRAME_NAMES.has(c) || c === "WARFRAME" || t === "Warframe Mod" || t === "Aura Mod" || c === "AURA") return "warframe";
  if (COMPAT_PRIMARY.has(c)   || /^(Primary|Rifle|Shotgun|Sniper|Bow)/i.test(t)) return "primary";
  if (COMPAT_SECONDARY.has(c) || /^(Secondary|Pistol)/i.test(t)) return "secondary";
  if (COMPAT_MELEE.has(c)     || /^(Melee|Stance)/i.test(t)) return "melee";
  if (COMPAT_ARCH_GUN.has(c)  || /^Arch-?Gun/i.test(t)) return "archgun";
  if (COMPAT_ARCH_MELEE.has(c)|| /^Arch-?Melee/i.test(t)) return "archmelee";
  if (COMPAT_ARCHWING.has(c)  || /^Archwing/i.test(t)) return "archwing";
  if (COMPAT_COMPANION.has(c) || /^(Companion|Sentinel)/i.test(t)) return "companion";
  if (COMPAT_NECRAMECH.has(c) || /^Necramech/i.test(t)) return "necramech";
  return "other";
}

/* Top-level grouping for the tab nav */
export const TOP_TREE = [
  {
    key: "weapons",
    children: ["primary", "secondary", "melee"],
  },
  {
    key: "warframe",
    children: [],
  },
  {
    key: "archwing",
    children: ["archwing", "archgun", "archmelee"],
  },
  {
    key: "companion",
    children: [],
  },
  {
    key: "other",
    children: ["necramech", "other"],
  },
];

export function matchesTop(category, topKey) {
  if (topKey === "all") return true;
  const node = TOP_TREE.find((n) => n.key === topKey);
  if (!node) return false;
  if (!node.children.length) return category === topKey;
  return node.children.includes(category);
}
