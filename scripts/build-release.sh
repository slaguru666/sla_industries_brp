#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist"

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/sla-brp.zip" "$OUT_DIR/sla-industries-brp.zip"

cd "$ROOT_DIR"
zip -r "$OUT_DIR/sla-brp.zip" sla-brp -x "*.DS_Store"
zip -r "$OUT_DIR/sla-industries-brp.zip" sla-industries-brp -x "*.DS_Store"

echo "Created:"
echo "  $OUT_DIR/sla-brp.zip"
echo "  $OUT_DIR/sla-industries-brp.zip"
