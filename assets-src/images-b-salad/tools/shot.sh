#!/bin/bash
# One screenshot at a time (images-b-salad): needs >= 2048 MB free RAM (waits up to ~5 min, re-checking every 30 s),
# one hidden Edge, closed afterwards. usage: tools/shot.sh <out.png> <page?query relative to images-b-salad/> [cssW cssH dpr]
OUT="$1"; Q="$2"; CW="${3:-800}"; CH="${4:-360}"; DPR="${5:-3}"
free_mb() { powershell -NoProfile -Command "[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)" | tr -d '\r'; }
headless() { powershell -NoProfile -Command "@(Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { \$_.CommandLine -like '*--headless*' }).Count" | tr -d '\r'; }
for i in $(seq 1 11); do F=$(free_mb); [ "$F" -ge 2048 ] && break; echo "waiting: only ${F} MB free"; sleep 30; done
if [ "$F" -lt 2048 ]; then echo "SKIP: only ${F} MB free after waiting"; exit 2; fi
[ "$(headless)" != "0" ] && { echo "a headless Edge is still running; refusing"; exit 3; }
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
ABS="$(cd "$(dirname "$OUT")" && pwd -W)/$(basename "$OUT")"
PROFILE="$(mktemp -d)"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$(cd "$PROFILE" && pwd -W)" \
  --force-device-scale-factor=$DPR --window-size=$CW,$CH --virtual-time-budget=20000 \
  --screenshot="$ABS" "http://localhost:8765/images-b-salad/$Q" 2>/dev/null
for i in 1 2 3 4 5; do [ "$(headless)" = "0" ] && break; sleep 1; done
H=$(headless); if [ "$H" != "0" ]; then powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { \$_.CommandLine -like '*--headless*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }"; fi
rm -rf "$PROFILE"
echo "free before ${F} MB; shot $(ls -la "$OUT" | awk '{print $5}') bytes; headless left: $(headless)"
