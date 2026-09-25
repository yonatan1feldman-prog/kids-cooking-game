#!/bin/bash
# One screenshot at a time: refuse unless >= 2048 MB of RAM is free; afterwards make sure no headless Edge is left.
# usage: tools/safe_shot.sh <out.png> <page?query> [cssW cssH dpr]   exit 2 = not enough memory (nothing shot)
free_mb() { powershell -NoProfile -Command "[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)" | tr -d '\r'; }
headless() { powershell -NoProfile -Command "@(Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { \$_.CommandLine -like '*--headless*' }).Count" | tr -d '\r'; }
F=$(free_mb)
if [ "$F" -lt 2048 ]; then echo "SKIP: only ${F} MB free"; exit 2; fi
echo "free before: ${F} MB"
"$(dirname "$0")/shot.sh" "$@"
for i in 1 2 3 4 5; do [ "$(headless)" = "0" ] && break; sleep 1; done
H=$(headless); if [ "$H" != "0" ]; then powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { \$_.CommandLine -like '*--headless*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }"; echo "closed $H leftover headless process(es)"; fi
echo "headless left: $(headless), free after: $(free_mb) MB"
