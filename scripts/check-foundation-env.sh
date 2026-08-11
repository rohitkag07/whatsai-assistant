#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

check_var() {
  local file="$1"
  local var="$2"

  if [[ ! -f "$file" ]]; then
    printf "missing-file  %s  (%s)\n" "$var" "$file"
    return
  fi

  local line
  line="$(grep -E "^${var}=" "$file" | tail -n 1 || true)"

  if [[ -z "$line" ]]; then
    printf "missing       %s  (%s)\n" "$var" "$file"
    return
  fi

  local value="${line#*=}"
  value="${value%$'\r'}"

  if [[ -z "$value" ]]; then
    printf "empty         %s  (%s)\n" "$var" "$file"
  else
    printf "set           %s  (%s)\n" "$var" "$file"
  fi
}

print_group() {
  local title="$1"
  shift
  printf "\n== %s ==\n" "$title"
  while (($#)); do
    local file="$1"
    local var="$2"
    check_var "$ROOT_DIR/$file" "$var"
    shift 2
  done
}

print_group "Dashboard" \
  ".env.local" "NEXT_PUBLIC_SUPABASE_URL" \
  ".env.local" "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  ".env.local" "SUPABASE_SERVICE_ROLE_KEY" \
  ".env.local" "DEFAULT_BUSINESS_ID" \
  ".env.local" "DEFAULT_BUILDER_ID" \
  ".env.local" "AGENT_SECRET"

print_group "Landing" \
  "apps/landing/.env.local" "NEXT_PUBLIC_SUPABASE_URL" \
  "apps/landing/.env.local" "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "apps/landing/.env.local" "SUPABASE_SERVICE_ROLE_KEY"

print_group "Summoner" \
  "agents/xerowa-summoner/.env" "SUPABASE_URL" \
  "agents/xerowa-summoner/.env" "SUPABASE_SERVICE_ROLE_KEY" \
  "agents/xerowa-summoner/.env" "DEFAULT_BUSINESS_ID" \
  "agents/xerowa-summoner/.env" "AGENT_SECRET"

print_group "Sales Agent" \
  "agents/xerowa-sales-agent/.env" "SUPABASE_URL" \
  "agents/xerowa-sales-agent/.env" "SUPABASE_SERVICE_ROLE_KEY" \
  "agents/xerowa-sales-agent/.env" "DEFAULT_BUSINESS_ID" \
  "agents/xerowa-sales-agent/.env" "AGENT_SECRET"

print_group "Tool Gateway" \
  "agents/xerowa-tool-gateway/.env" "AGENT_SECRET"

printf "\nTip: after changing env files, restart dashboard, landing, and the three XeroWA agents before trusting readiness JSON.\n"
