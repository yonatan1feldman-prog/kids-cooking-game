#!/bin/bash
# usage: tools/shot.sh <out.png> <page-and-query relative to cooking-game-assets/images-b/> [cssW cssH dpr]
# default: Android phone 20:9 landscape, 800x360 CSS px at dpr 3 -> 2400x1080 png
OUT="$1"; Q="$2"; CW="${3:-800}"; CH="${4:-360}"; DPR="${5:-3}"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
ABS="$(cd "$(dirname "$OUT")" && pwd -W)/$(basename "$OUT")"
PROFILE="$(mktemp -d)"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$(cd "$PROFILE" && pwd -W)" \
  --force-device-scale-factor=$DPR --window-size=$CW,$CH --virtual-time-budget=15000 \
  --screenshot="$ABS" "http://localhost:8765/images-b/$Q" 2>/dev/null
rm -rf "$PROFILE"
ls -la "$OUT" | awk '{print $5, $9}'
