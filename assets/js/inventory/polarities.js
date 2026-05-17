/* Polarity icon paths + display names. SVG drawn inline. */

export const POLARITIES = ["madurai", "naramon", "vazarin", "zenurik", "penjaga", "unairu", "umbra", "aura", "universal"];

export function polaritySvg(p) {
  const fill = "currentColor";
  switch (p) {
    case "madurai":  // V — damage
      return `<svg viewBox="0 0 24 24" fill="${fill}"><path d="M4 4l8 16 8-16-3 0-5 10-5-10z"/></svg>`;
    case "naramon":  // — utility
      return `<svg viewBox="0 0 24 24" fill="${fill}"><path d="M2 11h20v2H2z"/></svg>`;
    case "vazarin":  // D — defense
      return `<svg viewBox="0 0 24 24" fill="${fill}"><path d="M4 2v20h6c7 0 10-5 10-10S17 2 10 2H4zm4 3h2c4 0 7 3 7 7s-3 7-7 7H8V5z"/></svg>`;
    case "zenurik":  // ◇ — energy
      return `<svg viewBox="0 0 24 24" fill="${fill}"><path d="M12 2l8 10-8 10-8-10z"/></svg>`;
    case "penjaga":  // ♦ small
      return `<svg viewBox="0 0 24 24" fill="${fill}"><path d="M12 4l6 8-6 8-6-8z"/><path d="M2 12l4-4 4 4-4 4z"/><path d="M14 12l4-4 4 4-4 4z"/></svg>`;
    case "unairu":   // ⊥ — operator
      return `<svg viewBox="0 0 24 24" fill="${fill}"><path d="M11 4v10H4v3h7v3h2v-3h7v-3h-7V4z"/></svg>`;
    case "umbra":
      return `<svg viewBox="0 0 24 24" fill="${fill}"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="#000"/></svg>`;
    case "aura":     // R-like sun
      return `<svg viewBox="0 0 24 24" fill="${fill}"><path d="M12 2l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/></svg>`;
    case "universal":
      return `<svg viewBox="0 0 24 24" fill="${fill}"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8" stroke="#000" stroke-width="2"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" fill="${fill}"><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

export function polarityColor(p) {
  return {
    madurai:   "#ff4f4f",
    naramon:   "#7ab2ff",
    vazarin:   "#5cd66e",
    zenurik:   "#f5c463",
    penjaga:   "#c084fc",
    unairu:    "#ff9a3c",
    umbra:     "#e0e0e0",
    aura:      "#ffd75a",
    universal: "#9fb3c8",
  }[p] || "#9fb3c8";
}

export function rarityColor(r) {
  const s = String(r || "").toLowerCase();
  if (s.includes("legendary") || s.includes("легендарн")) return "#ffd75a";
  if (s.includes("riven")) return "#c084fc";
  if (s.includes("rare") || s.includes("редк")) return "#f5c463";
  if (s.includes("uncommon") || s.includes("необыч"))    return "#7ab2ff";
  if (s.includes("common") || s.includes("обыч"))        return "#cfd6df";
  if (s.includes("peculiar"))                            return "#5cd66e";
  return "#9fb3c8";
}

export function rarityLabel(r, lang) {
  if (!r) return "";
  const s = String(r);
  if (lang === "en") return s;
  const map = {
    "Common":    "Обычный",
    "Uncommon":  "Необычный",
    "Rare":      "Редкий",
    "Legendary": "Легендарный",
    "Riven":     "Ривен",
    "Peculiar":  "Особый",
  };
  return map[s] || s;
}
