import { CONFIG } from "../config.js";
import { t, getLang } from "../i18n.js";

export function formatLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatLocalDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCountdown(ms, lang = getLang()) {
  if (ms == null || Number.isNaN(ms)) return "";
  if (ms <= 0) return t("tracker.time.ended");
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dL = lang === "ru" ? "д" : "d";
  const hL = lang === "ru" ? "ч" : "h";
  if (d > 0) return `${d}${dL} ${h}${hL}`;
  if (h > 0) return `${h}${hL} ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatExpiryPhrase(iso, lang = getLang()) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  const time = formatLocal(iso);
  const left = formatCountdown(ms, lang);
  if (ms <= 0) return t("tracker.time.ended");
  return t("tracker.time.endsAt", { time, left });
}

export function formatStartsPhrase(iso, lang = getLang()) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "";
  const time = formatLocal(iso);
  const left = formatCountdown(ms, lang);
  return t("tracker.time.startsIn", { time, left });
}

export function progressFraction(activationIso, expiryIso) {
  if (!activationIso || !expiryIso) return 0;
  const a = new Date(activationIso).getTime();
  const e = new Date(expiryIso).getTime();
  const now = Date.now();
  if (e <= a) return 0;
  return Math.max(0, Math.min(1, (now - a) / (e - a)));
}

let tickerStarted = false;

export function startTicker(root = document) {
  if (tickerStarted) return;
  tickerStarted = true;
  const tick = () => {
    const lang = getLang();
    root.querySelectorAll("[data-expiry-phrase]").forEach((el) => {
      el.textContent = formatExpiryPhrase(el.dataset.expiryPhrase, lang);
    });
    root.querySelectorAll("[data-countdown]").forEach((el) => {
      const exp = el.dataset.countdown;
      if (!exp) return;
      const ms = new Date(exp).getTime() - Date.now();
      el.textContent = formatCountdown(ms, lang);
    });
    root.querySelectorAll("[data-starts-in]").forEach((el) => {
      el.textContent = formatStartsPhrase(el.dataset.startsIn, lang);
    });
    root.querySelectorAll("[data-progress]").forEach((el) => {
      const [a, e] = el.dataset.progress.split("|");
      const frac = progressFraction(a, e);
      el.style.width = `${(frac * 100).toFixed(2)}%`;
    });
  };
  tick();
  setInterval(tick, CONFIG.TRACKER_TICK_MS);
}
