#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.codex-runtime/phase6"
LOG_DIR="$RUN_DIR/logs"
PID_DIR="$RUN_DIR/pids"
NODE_BIN="${NODE_BIN:-$(command -v node)}"

mkdir -p "$LOG_DIR" "$PID_DIR"

start_agent() {
  local name="$1"
  local dir="$2"
  local log_file="$LOG_DIR/$name.log"
  local pid_file="$PID_DIR/$name.pid"

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name already running on pid $(cat "$pid_file")"
    return
  fi

  (
    cd "$ROOT_DIR/$dir"
    if [[ ! -d node_modules ]]; then
      npm install --omit=dev >/dev/null
    fi

    : >"$log_file"
    nohup "$NODE_BIN" --env-file=.env index.js < /dev/null >"$log_file" 2>&1 &
    local pid=$!
    disown "$pid" 2>/dev/null || true
    echo "$pid" >"$pid_file"
    sleep 1

    if kill -0 "$pid" 2>/dev/null; then
      echo "started $name on pid $pid"
    else
      echo "failed to keep $name running; recent log:"
      tail -n 40 "$log_file" || true
      return 1
    fi
  )
}

start_agent "sales-agent" "agents/xerowa-sales-agent"
start_agent "tool-gateway" "agents/xerowa-tool-gateway"
start_agent "summoner" "agents/xerowa-summoner"

echo "XeroWA core local stack boot requested"
