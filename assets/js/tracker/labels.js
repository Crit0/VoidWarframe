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
