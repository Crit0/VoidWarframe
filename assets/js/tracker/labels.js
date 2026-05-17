import { getLang } from "../i18n.js";

const REWARD_POOL = {
  "Sortie Rewards":      { ru: "Награды Sortie",        en: "Sortie rewards" },
  "Archon Hunt Rewards": { ru: "Награды Архон-охоты",   en: "Archon Hunt rewards" },
  "Steel Path Rewards":  { ru: "Награды Стального пути", en: "Steel Path rewards" },
  "Arbitration Rewards": { ru: "Награды Арбитража",     en: "Arbitration rewards" },
};

export function translatePool(name) {
  if (!name) return "";
  const lang = getLang();
  return REWARD_POOL[name]?.[lang] || name;
}

const FACTION = {
  "Grineer": { ru: "Гринир", en: "Grineer" },
  "Corpus":  { ru: "Корпус", en: "Corpus" },
  "Infested":{ ru: "Заражённые", en: "Infested" },
  "Corrupted": { ru: "Искажённые", en: "Corrupted" },
  "Tenno":   { ru: "Тенно", en: "Tenno" },
  "Orokin":  { ru: "Орокин", en: "Orokin" },
  "Sentient":{ ru: "Сентиенты", en: "Sentient" },
  "Murmur":  { ru: "Мурмур", en: "Murmur" },
};

export function translateFaction(name) {
  if (!name) return "";
  const lang = getLang();
  return FACTION[name]?.[lang] || name;
}

const REWARD_TERMS = {
  "Vitus Essence":              { ru: "Эссенция Витус",   en: "Vitus Essence" },
  "Steel Essence":              { ru: "Эссенция Стали",   en: "Steel Essence" },
  "Endo":                       { ru: "Эндо",             en: "Endo" },
  "Forma":                      { ru: "Форма",            en: "Forma" },
  "Forma Blueprint":            { ru: "Чертёж Формы",     en: "Forma Blueprint" },
  "Nitain Extract":             { ru: "Экстракт Нитаина", en: "Nitain Extract" },
  "Kuva":                       { ru: "Кува",             en: "Kuva" },
  "Aya":                        { ru: "Aya",              en: "Aya" },
  "Regal Aya":                  { ru: "Regal Aya",        en: "Regal Aya" },
  "Riven Mod":                  { ru: "Ривен-мод",        en: "Riven Mod" },
  "Riven Sliver":               { ru: "Осколок Ривена",   en: "Riven Sliver" },
  "Archon Shard":               { ru: "Осколок Архона",   en: "Archon Shard" },
  "Crimson Archon Shard":       { ru: "Алый осколок Архона",     en: "Crimson Archon Shard" },
  "Amber Archon Shard":         { ru: "Янтарный осколок Архона", en: "Amber Archon Shard" },
  "Azure Archon Shard":         { ru: "Лазурный осколок Архона", en: "Azure Archon Shard" },
  "Tauforged Crimson Archon Shard": { ru: "Алый Тауфорджевый осколок", en: "Tauforged Crimson Archon Shard" },
  "Tauforged Amber Archon Shard":   { ru: "Янтарный Тауфорджевый осколок", en: "Tauforged Amber Archon Shard" },
  "Tauforged Azure Archon Shard":   { ru: "Лазурный Тауфорджевый осколок", en: "Tauforged Azure Archon Shard" },
  "Orokin Catalyst":            { ru: "Орокинский Катализатор", en: "Orokin Catalyst" },
  "Orokin Reactor":             { ru: "Орокинский Реактор",     en: "Orokin Reactor" },
  "Catalyst Blueprint":         { ru: "Чертёж Катализатора",    en: "Catalyst Blueprint" },
  "Reactor Blueprint":          { ru: "Чертёж Реактора",        en: "Reactor Blueprint" },
  "Exilus Adapter":             { ru: "Адаптер Exilus",          en: "Exilus Adapter" },
  "Exilus Weapon Adapter":      { ru: "Оружейный адаптер Exilus", en: "Exilus Weapon Adapter" },
  "Orokin Cell":                { ru: "Орокинская клетка",        en: "Orokin Cell" },
  "Argon Crystal":              { ru: "Кристалл Аргона",          en: "Argon Crystal" },
  "Tellurium":                  { ru: "Теллуриум",                en: "Tellurium" },
  "Credits":                    { ru: "Кредиты",                  en: "Credits" },
};

// Patterns for in-place substitution inside compound reward strings ("3000x Endo", "Endo Cache")
const TERM_PATTERNS = Object.keys(REWARD_TERMS).sort((a, b) => b.length - a.length);

export function translateReward(text) {
  if (!text) return "";
  const lang = getLang();
  if (lang === "en") return text;
  // Exact match first
  if (REWARD_TERMS[text]) return REWARD_TERMS[text].ru;
  // Substitute known terms inside the string
  let out = String(text);
  for (const term of TERM_PATTERNS) {
    if (out.indexOf(term) === -1) continue;
    out = out.split(term).join(REWARD_TERMS[term].ru);
  }
  return out;
}

/* Loot-type classification for filter. Returns array of tags an entry's
   reward + kind belong to: ["prime", "relic", "archon", "steelEssence",
   "aya", "forma", "kuva", "endo", "nitain"] */
const LOOT_PATTERNS = [
  { tag: "archon",        re: /\barchon\s*shard|осколок\s*архона|tauforged/i },
  { tag: "steelEssence",  re: /steel\s*essence|эссенц\w*\s*стали/i },
  { tag: "aya",           re: /\b(aya|regal\s*aya)\b/i },
  { tag: "forma",         re: /\bforma|форм/i },
  { tag: "kuva",          re: /\bkuva|кув/i },
  { tag: "endo",          re: /\bendo|эндо/i },
  { tag: "nitain",        re: /\bnitain|нитаин/i },
  { tag: "relic",         re: /\b(relic|реликв|lith|meso|neo|axi|requiem|лит|мезо|нео|акси|реквием)\b/i },
  { tag: "prime",         re: /\bprime|прайм/i },
];

export function lootTagsOf(entry) {
  const tags = new Set();
  const blob = [
    entry.kind || "",
    entry.title || "",
    entry.subtitle || "",
    ...(Array.isArray(entry.rewards) ? entry.rewards : [entry.rewards || ""]),
  ].join(" ").toLowerCase();

  if (entry.kind === "archonHunt") tags.add("archon");
  if (entry.kind === "arbitration") tags.add("aya"); /* nope - vitus, but rare */
  if (entry.kind === "fissure") { tags.add("relic"); tags.add("prime"); }
  if (entry.kind === "sortie") tags.add("forma");

  for (const { tag, re } of LOOT_PATTERNS) {
    if (re.test(blob)) tags.add(tag);
  }
  return tags;
}

export function matchesLootTypes(entry, chosen) {
  if (!chosen || !chosen.length) return true;
  const have = lootTagsOf(entry);
  return chosen.some((t) => have.has(t));
}
