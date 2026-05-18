import { refresh } from "./index.js";
import { getLang } from "../i18n.js";

const ACTIVE = 30 * 1000;
const HIDDEN = 5 * 60 * 1000;
let timer = null;
let started = false;
let kindsToPoll = ["worldstate"];

function tick() {
  const lang = getLang();
  for (const k of kindsToPoll) refresh(k, lang);
  schedule();
}

function schedule() {
  clearTimeout(timer);
  const ms = document.hidden ? HIDDEN : ACTIVE;
  timer = setTimeout(tick, ms);
}

export function startPolling(kinds = ["worldstate"]) {
  if (started) return;
  started = true;
  kindsToPoll = kinds.slice();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
    else schedule();
  });
  schedule();
}

export function stopPolling() {
  clearTimeout(timer);
  timer = null;
  started = false;
}
