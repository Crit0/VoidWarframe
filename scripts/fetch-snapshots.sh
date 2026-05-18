#!/usr/bin/env bash
set -euo pipefail

BASE="https://api.warframestat.us"
PLATFORM="pc"
OUT="assets/data"
mkdir -p "$OUT"

fetch() {
  local url="$1" dest="$2"
  echo "-> $url"
  curl --fail --silent --show-error --retry 5 --retry-delay 8 \
       --max-time 90 -H "Accept: application/json" \
       "$url" -o "$dest.tmp"
  python3 -m json.tool "$dest.tmp" > /dev/null
  mv "$dest.tmp" "$dest"
}

MODS_FIELDS="name,uniqueName,imageName,description,polarity,baseDrain,fusionLimit,type,rarity,compatName,isAugment,levelStats"

for L in ru en; do
  fetch "$BASE/$PLATFORM/?language=$L"              "$OUT/worldstate.$L.json"
  fetch "$BASE/mods?language=$L&only=$MODS_FIELDS"  "$OUT/mods.$L.raw.json"
  node scripts/slim-mods.mjs "$OUT/mods.$L.raw.json" "$OUT/mods.$L.json"
  rm "$OUT/mods.$L.raw.json"
  fetch "$BASE/arcanes?language=$L"                 "$OUT/arcanes.$L.json"
  fetch "$BASE/items?language=$L&only=name,uniqueName,imageName" "$OUT/items.$L.json"
done

node scripts/build-manifest.mjs "$OUT"
echo "snapshots updated"
