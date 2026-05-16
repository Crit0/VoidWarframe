/* Loads the SVG sprite (assets/img/glyphs.svg) and injects it into <body>
   so <use href="#g-…"/> works from any page depth without absolute paths. */

let injected = false;

export async function injectGlyphs() {
  if (injected) return;
  injected = true;
  try {
    const url = new URL("../img/glyphs.svg", import.meta.url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const svg = await res.text();
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = svg;
    document.body.prepend(wrap);
  } catch (err) {
    console.warn("[VW] glyph sprite injection failed:", err);
    injected = false;
  }
}
