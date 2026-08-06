#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${STAGING_DATABASE_URL:-}" ]]; then
  echo "STAGING_DATABASE_URL is required" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
verifier_sql="$script_dir/../supabase/tests/staging_migration_verifier.sql"

psql "$STAGING_DATABASE_URL" \
  --no-psqlrc \
  --set=ON_ERROR_STOP=1 \
  --file="$verifier_sql"
