import { readFileSync, writeFileSync } from "node:fs";
import { slimMod } from "../assets/js/inventory/slim-mod.js";

const [src, dst] = process.argv.slice(2);
if (!src || !dst) {
  console.error("usage: slim-mods.mjs <src> <dst>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(src, "utf8"));
const slim = Array.isArray(raw) ? raw.map(slimMod) : [];
writeFileSync(dst, JSON.stringify(slim));
console.log(`slimmed ${Array.isArray(raw) ? raw.length : 0} mods -> ${dst}`);
