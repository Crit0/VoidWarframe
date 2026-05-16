import { CONFIG } from "./config.js";

const state = {
  lang: CONFIG.DEFAULT_LANG,
  dict: {},
  listeners: new Set(),
};

function getStoredLang() {
  try {
    const v = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (v && CONFIG.SUPPORTED_LANGS.includes(v)) return v;
  } catch {}
  const nav = (navigator.language || "").slice(0, 2).toLowerCase();
  if (CONFIG.SUPPORTED_LANGS.includes(nav)) return nav;
  return CONFIG.DEFAULT_LANG;
}

async function loadDict(lang) {
  const url = new URL(`../i18n/${lang}.json`, import.meta.url);
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`i18n load failed: ${lang} (HTTP ${res.status})`);
  return res.json();
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

export function t(key, vars) {
  const raw = getByPath(state.dict, key);
  if (raw == null) return key;
  if (!vars) return raw;
  return Object.keys(vars).reduce(
    (s, k) => s.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]),
    raw,
  );
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.documentElement.lang = state.lang;
  document.title = t("meta.title");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t("meta.description"));
}

export function getLang() {
  return state.lang;
}

export async function setLang(lang) {
  if (!CONFIG.SUPPORTED_LANGS.includes(lang)) return;
  state.lang = lang;
  state.dict = await loadDict(lang);
  try { localStorage.setItem(CONFIG.STORAGE_KEY, lang); } catch {}
  applyI18n();
  state.listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn) {
  state.listeners.add(fn);
  return () => state.listeners.delete(fn);
}

export async function initI18n() {
  const lang = getStoredLang();
  state.lang = lang;
  state.dict = await loadDict(lang);
  applyI18n();
  return lang;
}
