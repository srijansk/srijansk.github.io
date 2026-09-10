#!/usr/bin/env bash
# Rasterise every post's lead plate into its social card.
#
# The plate ships twice: plate.svg is what the page and the card thumbnail
# use, card.png is what og:image points at, because most platforms will not
# render an SVG social preview. Run this after editing any plate.svg, or the
# card people see when they share the post will be the previous drawing.
#
#   ./scripts/build-social-cards.sh
#
# Requires rsvg-convert (brew install librsvg).
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert not found — brew install librsvg" >&2
  exit 1
fi

shopt -s nullglob
found=0
for plate in public/writing/*/plate.svg; do
  card="$(dirname "$plate")/card.png"
  rsvg-convert -w 1200 -h 630 -b '#FAFAF7' -o "$card" "$plate"
  printf '  %-58s -> %s\n' "$plate" "$(du -h "$card" | cut -f1)"
  found=$((found + 1))
done

if [ "$found" -eq 0 ]; then
  echo "no plates found under public/writing/*/plate.svg" >&2
  exit 1
fi

echo "$found social card(s) rebuilt."
