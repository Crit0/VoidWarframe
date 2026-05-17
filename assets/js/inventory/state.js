/* User inventory state: which mods/arcanes/shards the player owns.
   Stored in localStorage; the future builder will read this. */

const KEY = "vw_inventory_v1";

const listeners = new Set();
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { mods: {}, arcanes: {}, shards: {} };
    const parsed = JSON.parse(raw);
    return {
      mods:    parsed.mods    && typeof parsed.mods    === "object" ? parsed.mods    : {},
      arcanes: parsed.arcanes && typeof parsed.arcanes === "object" ? parsed.arcanes : {},
      shards:  parsed.shards  && typeof parsed.shards  === "object" ? parsed.shards  : {},
    };
  } catch { return { mods: {}, arcanes: {}, shards: {} }; }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function emit() { listeners.forEach((fn) => fn(state)); }

export function getInventoryState() { return state; }

export function onInventoryChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function isOwned(kind, uniqueName) {
  return !!(state[kind] && state[kind][uniqueName]);
}

export function toggleOwned(kind, uniqueName) {
  if (!state[kind]) state[kind] = {};
  if (state[kind][uniqueName]) delete state[kind][uniqueName];
  else state[kind][uniqueName] = 1;
  save(); emit();
}

export function setOwned(kind, uniqueName, value) {
  if (!state[kind]) state[kind] = {};
  if (value) state[kind][uniqueName] = 1;
  else delete state[kind][uniqueName];
  save(); emit();
}

export function countOwned(kind) {
  return Object.keys(state[kind] || {}).length;
}

export function clearKind(kind) {
  state[kind] = {};
  save(); emit();
}

export function exportInventory() {
  return JSON.stringify(state);
}

export function importInventory(json) {
  try {
    const parsed = JSON.parse(json);
    state = {
      mods:    parsed.mods    || {},
      arcanes: parsed.arcanes || {},
      shards:  parsed.shards  || {},
    };
    save(); emit();
    return true;
  } catch { return false; }
}
