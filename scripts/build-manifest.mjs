import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: build-manifest.mjs <dir>");
  process.exit(1);
}

const now = new Date().toISOString();
const files = {};
for (const f of readdirSync(dir).sort()) {
  if (!f.endsWith(".json") || f === "manifest.json") continue;
  const st = statSync(join(dir, f));
  files[f.replace(/\.json$/, "")] = { ts: now, bytes: st.size };
}

writeFileSync(
  join(dir, "manifest.json"),
  JSON.stringify({ generatedAt: now, version: 1, files }, null, 2),
);
console.log(`manifest written with ${Object.keys(files).length} entries`);
