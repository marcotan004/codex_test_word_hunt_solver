#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT_DIR/.dev-pids"

SERVER_PORT="${SERVER_PORT:-5174}"
CLIENT_PORT="${CLIENT_PORT:-8080}"

if [ -f "$PID_FILE" ]; then
  echo "Dev processes already running (PID file exists: $PID_FILE)."
  echo "Run scripts/dev-down.sh first."
  exit 1
fi

# Load nvm if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use 22 >/dev/null || true
fi

mkdir -p "$ROOT_DIR/.logs"

# Start server
(
  cd "$ROOT_DIR/server"
  nohup npm run dev > "$ROOT_DIR/.logs/server.log" 2>&1 &
  echo $! > "$PID_FILE"
)

# Start client
(
  cd "$ROOT_DIR/client"
  nohup npm run dev -- --port "$CLIENT_PORT" > "$ROOT_DIR/.logs/client.log" 2>&1 &
  echo $! >> "$PID_FILE"
)

echo "Started server on http://localhost:$SERVER_PORT and client on http://localhost:$CLIENT_PORT"
echo "Logs: $ROOT_DIR/.logs/server.log and $ROOT_DIR/.logs/client.log"
