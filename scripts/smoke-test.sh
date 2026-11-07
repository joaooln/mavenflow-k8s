#!/usr/bin/env bash
# End-to-end API check: register a user, log in and create a board.
# Usage: scripts/smoke-test.sh http://localhost:3001
set -euo pipefail

API="${1:-http://localhost:3001}"
EMAIL="smoke-$(date +%s)-$RANDOM@example.com"
json() { python3 -c "import sys, json; print(json.load(sys.stdin)$1)"; }

echo "health:  $(curl -sf "$API/api/health")"

curl -sf -X POST "$API/api/auth/register" -H 'content-type: application/json' \
  -d "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"secret123\"}" > /dev/null
echo "register: ok ($EMAIL)"

TOKEN=$(curl -sf -X POST "$API/api/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" | json "['token']")
echo "login:   ok"

BOARD=$(curl -sf -X POST "$API/api/boards" -H 'content-type: application/json' \
  -H "Authorization: Bearer $TOKEN" -d '{"title":"Smoke board"}')
echo "board:   $BOARD"

COUNT=$(curl -sf "$API/api/boards" -H "Authorization: Bearer $TOKEN" | json ".__len__()")
[ "$COUNT" -ge 1 ] && echo "boards:  $COUNT found - OK"
