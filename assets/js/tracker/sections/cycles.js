import { t } from "../../i18n.js";
import { progressFraction } from "../format.js";

const CYCLES = [
  { key: "earth",   field: "earthCycle",   stateFn: (c) => (c.isDay ? "day" : "night"),
    glyphFn: (s) => (s === "day" ? "g-sun" : "g-moon") },
  { key: "cetus",   field: "cetusCycle",   stateFn: (c) => (c.isDay ? "day" : "night"),
    glyphFn: (s) => (s === "day" ? "g-sun" : "g-moon") },
  { key: "vallis",  field: "vallisCycle",  stateFn: (c) => (c.isWarm ? "warm" : "cold"),
    glyphFn: (s) => (s === "warm" ? "g-flame" : "g-snow") },
  { key: "cambion", field: "cambionCycle", stateFn: (c) => (c.active || c.state || "fass"),
    glyphFn: (s) => (s === "vome" ? "g-eye" : "g-flame") },
  { key: "duviri",  field: "duviriCycle",  stateFn: (c) => (c.state || "joy"),
    glyphFn: () => "g-mask" },
  { key: "zariman", field: "zarimanCycle", stateFn: (c) => (c.isCorpus ? "corpus" : "grineer"),
    glyphFn: () => "g-eye" },
];

const RADIUS = 40;
const CIRC = 2 * Math.PI * RADIUS;

function dialSvg() {
  return `
    <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true">
      <circle class="cycle-dial__bg" cx="50" cy="50" r="${RADIUS}"></circle>
      <circle class="cycle-dial__fg" cx="50" cy="50" r="${RADIUS}"
              stroke-dasharray="${CIRC.toFixed(2)}"
              stroke-dashoffset="${CIRC.toFixed(2)}"></circle>
    </svg>
  `;
}

export function renderSkeletons(container) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < CYCLES.length; i++) {
    const sk = document.createElement("div");
    sk.className = "cycle-dial";
    sk.innerHTML = `
      <div class="skeleton skel-line" style="width:60%; height:8px"></div>
      <div class="skeleton" style="width:92px; height:92px; border-radius:50%"></div>
      <div class="skeleton skel-line" style="width:50%; height:8px"></div>
    `;
    container.appendChild(sk);
  }
}

export function renderCycles(container, data) {
  if (!container) return;
  container.innerHTML = "";
  CYCLES.forEach((def) => {
    const c = data?.[def.field];
    if (!c) return;
    const state = String(def.stateFn(c)).toLowerCase();
    const planetLabel = t(`tracker.cycles.${def.key}.label`);
    const stateLabel = t(`tracker.cycles.${def.key}.${state}`);
    const glyphId = def.glyphFn(state);

    const card = document.createElement("article");
    card.className = `cycle-dial dial--${state}`;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", planetLabel);
    card.innerHTML = `
      <div class="cycle-dial__planet">${planetLabel}</div>
      <div class="cycle-dial__ring">
        ${dialSvg()}
        <div class="cycle-dial__center">
          <svg aria-hidden="true"><use href="#${glyphId}"/></svg>
          <span class="cycle-dial__state">${stateLabel}</span>
        </div>
      </div>
      <div class="cycle-dial__time" data-countdown="${c.expiry || ""}">—</div>
      <div class="cycle-dial__local">${c.expiry ? new Date(c.expiry).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : ""}</div>
    `;

    const fg = card.querySelector(".cycle-dial__fg");
    fg.dataset.dialProgress = `${c.activation || ""}|${c.expiry || ""}`;
    const frac = progressFraction(c.activation, c.expiry);
    fg.setAttribute("stroke-dashoffset", (CIRC * (1 - frac)).toFixed(2));
    container.appendChild(card);
  });
}

export function tickDials(root = document) {
  root.querySelectorAll("[data-dial-progress]").forEach((el) => {
    const [a, e] = el.dataset.dialProgress.split("|");
    if (!a || !e) return;
    const frac = progressFraction(a, e);
    el.setAttribute("stroke-dashoffset", (CIRC * (1 - frac)).toFixed(2));
  });
}
