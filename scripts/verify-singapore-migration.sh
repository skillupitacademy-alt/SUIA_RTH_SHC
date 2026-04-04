#!/usr/bin/env bash
# Singapore migration post-cutover verification

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

echo "Singapore Migration Verification"
echo "================================"
echo

test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local description="$4"

  echo -n "Testing ${name}... "

  local response
  response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" "$url" 2>&1 || true)
  local status_code
  status_code=$(echo "$response" | cut -d'|' -f1)
  local time_total
  time_total=$(echo "$response" | cut -d'|' -f2)

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}PASS${NC} (${status_code}, ${time_total}s) - ${description}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC} (expected ${expected_status}, got ${status_code}) - ${description}"
    FAILED=$((FAILED + 1))
  fi
}

test_with_latency() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  echo -n "Testing ${name} (latency)... "

  local format_file
  format_file="$(mktemp)"
  cat > "$format_file" <<'EOF'
%{http_code}|%{time_namelookup}|%{time_connect}|%{time_starttransfer}|%{time_total}
EOF

  local response
  response=$(curl -s -o /dev/null -w "@${format_file}" "$url" 2>&1 || true)
  rm -f "$format_file"

  local status_code
  status_code=$(echo "$response" | cut -d'|' -f1)
  local time_namelookup
  time_namelookup=$(echo "$response" | cut -d'|' -f2)
  local time_connect
  time_connect=$(echo "$response" | cut -d'|' -f3)
  local time_starttransfer
  time_starttransfer=$(echo "$response" | cut -d'|' -f4)
  local time_total
  time_total=$(echo "$response" | cut -d'|' -f5)

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}PASS${NC}"
    echo "  Status: ${status_code}"
    echo "  DNS Lookup: ${time_namelookup}s"
    echo "  Connect: ${time_connect}s"
    echo "  Time to First Byte: ${time_starttransfer}s"
    echo "  Total Time: ${time_total}s"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC} (expected ${expected_status}, got ${status_code})"
    FAILED=$((FAILED + 1))
  fi
}

echo "1. Health Checks"
echo "----------------"
echo

test_endpoint "API Health (Live)" "https://api.realtutorialhub.com/api/health/live" "200" "API liveness"
test_endpoint "RTH Web Home" "https://user.realtutorialhub.com/" "200" "RealTutorialHub web"
test_endpoint "RTH Admin Home" "https://admin.realtutorialhub.com/" "200" "RealTutorialHub admin"
test_endpoint "SkillUp Web Health" "https://user.skillupitacademy.com/api/healthz" "200" "SkillUp web"
test_endpoint "SkillUp Admin Health" "https://admin.skillupitacademy.com/api/healthz" "200" "SkillUp admin"
test_endpoint "Faculty App Health" "https://faculty.skillupitacademy.com/api/healthz" "200" "Faculty app"
test_endpoint "SkillHubCore Health" "https://api.skillhubcore.in/healthz" "200" "SkillHubCore service"

echo
echo "2. Authentication"
echo "-----------------"
echo

echo -n "Testing admin login... "
login_response=$(curl -s -X POST "https://api.realtutorialhub.com/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-brand: realtutorialhub" \
  -H "x-portal-identity: admin" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  -w "%{http_code}")

login_status=$(echo "$login_response" | tail -c 4)

if [ "$login_status" = "200" ]; then
  echo -e "${GREEN}PASS${NC} (200)"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC} (expected 200, got ${login_status})"
  FAILED=$((FAILED + 1))
fi

echo
echo "3. Latency Sample"
echo "-----------------"
echo

test_with_latency "API Health (Live)" "https://api.realtutorialhub.com/api/health/live" "200"

echo
echo "4. Cloud Run Region"
echo "-------------------"
echo

if command -v gcloud >/dev/null 2>&1; then
  gcloud run services list --region=asia-southeast1 --format='table(metadata.name,status.url,status.latestReadyRevisionName)'
else
  echo -e "${YELLOW}gcloud not available${NC}"
fi

echo
echo "Summary"
echo "-------"
echo "Passed: ${PASSED}"
echo "Failed: ${FAILED}"
echo

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All checks passed.${NC}"
  exit 0
fi

echo -e "${RED}Some checks failed.${NC}"
exit 1
