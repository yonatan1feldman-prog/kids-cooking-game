#!/bin/bash
# Shoot scenes one at a time with tools/shot.sh: tools/shoot.sh <prefix> <scene> [scene...]   (20:9, world 2400, canvas path)
# Each shot runs only after the previous one finished (and shot.sh's own guards: .browser-busy, >= 2 GB free, no headless browser).
P="$1"; shift
cd "$(dirname "$0")/.."
for s in "$@"; do
  echo "== $s"; bash tools/shot.sh "shots/$P-${s#smoothie-}.png" "scene.html?s=$s&w=2400&canvas=1" 1200 540 1 | tail -1
done
