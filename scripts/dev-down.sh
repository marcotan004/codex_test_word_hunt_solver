#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT_DIR/.dev-pids"

if [ -f "$PID_FILE" ]; then
  while read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
  echo "Stopped dev processes (by PID file)."
else
  echo "No PID file found. Attempting to stop by ports (5174, 8080)."
  lsof -ti :5174 | xargs -r kill || true
  lsof -ti :8080 | xargs -r kill || true
fi
