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

# Every page requires sign-in, so signed-out visitors are redirected to /login.
check_status "home-redirects-to-login" "307" "$BASE_URL/"
check_status "login-page" "200" "$BASE_URL/login"
check_status "signup-page" "200" "$BASE_URL/signup"
check_status "auth-csrf" "200" "$BASE_URL/api/auth/csrf"
check_status "protected-project-create" "401" -X POST "$BASE_URL/api/projects" -H "Content-Type: application/json" -d "{}"
check_status "protected-profile-get" "401" "$BASE_URL/api/profile"
check_status "protected-admin-export" "401" "$BASE_URL/api/admin/analytics/export"

echo "Smoke API checks passed."
