import { CONFIG } from "../config.js";

const BASE = CONFIG.API_BASE;
const PLATFORM = CONFIG.PLATFORM;

export const FIELDS = {
  mods: "name,uniqueName,imageName,description,polarity,baseDrain,fusionLimit,type,rarity,compatName,isAugment,levelStats,incompatibleMods,transmutable,availability,wikiaUrl",
  items: "name,uniqueName,imageName,category,description,wikiaUrl,tradable,type",
  arcanes: null,
  worldstate: null,
};

export function endpointUrl(kind, lang) {
  switch (kind) {
    case "worldstate":
      return `${BASE}/${PLATFORM}/?language=${lang}`;
    case "mods":
      return `${BASE}/mods?language=${lang}&only=${FIELDS.mods}`;
    case "arcanes":
      return `${BASE}/arcanes?language=${lang}`;
    case "items":
      return `${BASE}/items?language=${lang}&only=${FIELDS.items}`;
    default:
      throw new Error(`unknown endpoint kind: ${kind}`);
  }
}

export const TTL = {
  worldstate: 60 * 1000,
  mods: 24 * 3600 * 1000,
  arcanes: 24 * 3600 * 1000,
  items: 24 * 3600 * 1000,
};

export const STORAGE = {
  worldstate: { type: "session", prefix: "vw_ws_" },
  mods:       { type: "local",   prefix: "vw_mods_" },
  arcanes:    { type: "local",   prefix: "vw_arcanes_" },
  items:      { type: "local",   prefix: "vw_items_" },
};
