#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORLD_ID="sla-brp"
OUT_DIR="$ROOT_DIR/dist"
ZIP_PATH="$OUT_DIR/${WORLD_ID}.zip"

mkdir -p "$OUT_DIR"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR"
zip -r "$ZIP_PATH" "$WORLD_ID" -x "*.DS_Store"

echo "Created $ZIP_PATH"
