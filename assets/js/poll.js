import { getWorldstate } from "./api.js";
import { CacheBus } from "./cache-bus.js";
import { getLang } from "./i18n.js";

const ACTIVE_INTERVAL = 30 * 1000;
const HIDDEN_INTERVAL = 5 * 60 * 1000;
let timer = null;
let started = false;

function tick() {
  const lang = getLang();
  getWorldstate(lang, { force: true })
    .then(({ source }) => {
      CacheBus.dispatchEvent(new CustomEvent("worldstate-updated", { detail: { lang, source } }));
    })
    .catch(() => { /* status pill already informed via worldstate-failed event */ });
  schedule();
}

function schedule() {
  clearTimeout(timer);
  const ms = document.hidden ? HIDDEN_INTERVAL : ACTIVE_INTERVAL;
  timer = setTimeout(tick, ms);
}

export function startWorldstatePolling() {
  if (started) return;
  started = true;
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
    else schedule();
  });
  schedule();
}

export function stopWorldstatePolling() {
  clearTimeout(timer);
  timer = null;
  started = false;
}
