#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTGRES_PREFIX="${POSTGRES_PREFIX:-$(brew --prefix postgresql@17)}"
POSTGRES_BIN="${POSTGRES_BIN:-$POSTGRES_PREFIX/bin}"
POSTGRES_SHARE="${POSTGRES_SHARE:-$POSTGRES_PREFIX/share/postgresql}"
STAGING_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/xerowa-pilot-staging.XXXXXX")"
DATA_DIR="$STAGING_ROOT/data"
SOCKET_DIR="$STAGING_ROOT/socket"
PORT="55439"

cleanup() {
  if [[ -d "$DATA_DIR" ]]; then
    "$POSTGRES_BIN/pg_ctl" -D "$DATA_DIR" -m fast stop >/dev/null 2>&1 || true
  fi
  rm -rf "$STAGING_ROOT"
}
trap cleanup EXIT

for binary in initdb pg_ctl createdb psql; do
  if [[ ! -x "$POSTGRES_BIN/$binary" ]]; then
    echo "Missing PostgreSQL binary: $POSTGRES_BIN/$binary" >&2
    exit 2
  fi
done

mkdir -p "$SOCKET_DIR"
TZ=UTC "$POSTGRES_BIN/initdb" -D "$DATA_DIR" -L "$POSTGRES_SHARE" --auth=trust --no-locale --encoding=UTF8 >/dev/null
"$POSTGRES_BIN/pg_ctl" -D "$DATA_DIR" -o "-c listen_addresses='' -c unix_socket_directories='$SOCKET_DIR' -p $PORT" -w start >/dev/null
"$POSTGRES_BIN/createdb" -h "$SOCKET_DIR" -p "$PORT" xerowa_pilot_staging

PSQL=("$POSTGRES_BIN/psql" -X -v ON_ERROR_STOP=1 -h "$SOCKET_DIR" -p "$PORT" -d xerowa_pilot_staging)

"${PSQL[@]}" -f "$PROJECT_ROOT/supabase/tests/pilot_security_staging_bootstrap.sql" >/dev/null
"${PSQL[@]}" -f "$PROJECT_ROOT/supabase/migrations/20260812222528_pilot_authorization_hotfix.sql" >/dev/null
"${PSQL[@]}" -f "$PROJECT_ROOT/supabase/migrations/20260812222529_pilot_operational_controls.sql" >/dev/null
"${PSQL[@]}" -f "$PROJECT_ROOT/supabase/tests/pilot_security_staging_verifier.sql"
