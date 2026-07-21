#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

check_status() {
  local label="$1"
  local expected="$2"
  shift 2

  local code
  code=$(curl -sS -o /tmp/smoke-api-body -w "%{http_code}" "$@")

  if [[ "$code" != "$expected" ]]; then
    echo "[$label] expected $expected, got $code"
    cat /tmp/smoke-api-body
    exit 1
  fi

  echo "[$label] $code"
}

check_status "home-page" "200" "$BASE_URL/"
check_status "auth-signin" "200" "$BASE_URL/api/auth/signin"
check_status "protected-project-create" "401" -X POST "$BASE_URL/api/projects" -H "Content-Type: application/json" -d "{}"
check_status "protected-profile-get" "401" "$BASE_URL/api/profile"

echo "Smoke API checks passed."
