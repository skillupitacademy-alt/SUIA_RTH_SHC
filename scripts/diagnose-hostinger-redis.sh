#!/usr/bin/env bash
# Hostinger Redis Diagnostic Script
# Run this ON THE HOSTINGER VPS after SSH

set -euo pipefail

echo "========================================"
echo "HOSTINGER REDIS DIAGNOSTIC"
echo "========================================"
echo ""

# Step 1: Verify environment file structure
echo "=== STEP 1: ENV FILE STRUCTURE ==="
ls -la /opt/platform/env/.env.production 2>/dev/null || echo "❌ /opt/platform/env/.env.production NOT FOUND"
ls -la /opt/platform/env/shared/.env 2>/dev/null || echo "❌ /opt/platform/env/shared/.env NOT FOUND"
echo ""
echo "Services directory:"
ls -la /opt/platform/env/services/ 2>/dev/null || echo "❌ /opt/platform/env/services/ NOT FOUND"
echo ""
echo "Brands directory:"
ls -la /opt/platform/env/brands/ 2>/dev/null || echo "❌ /opt/platform/env/brands/ NOT FOUND"
echo ""

# Step 2: Check Redis variables (SANITIZED)
echo "=== STEP 2: REDIS VARIABLES IN ENV FILES ==="
echo "Shared env Redis variables:"
grep -E '^REDIS_URL=|^UPSTASH_REDIS' \
  /opt/platform/env/shared/.env 2>/dev/null \
  | sed 's/=.*$/=<REDACTED>/' || echo "❌ No Redis variables found in shared/.env"
echo ""

echo "Production env Redis variables:"
grep -E '^REDIS_URL=|^UPSTASH_REDIS' \
  /opt/platform/env/.env.production 2>/dev/null \
  | sed 's/=.*$/=<REDACTED>/' || echo "❌ No Redis variables found in .env.production"
echo ""

# Step 3: Check container runtime environment (SANITIZED)
echo "=== STEP 3: CONTAINER RUNTIME ENVIRONMENT ==="
echo "API-SERVER Redis environment:"
docker exec api-server sh -c \
  'env | grep -E "^REDIS|^UPSTASH_REDIS" | sed "s/=.*$/=<REDACTED>/"' 2>/dev/null || echo "❌ Could not check api-server environment"
echo ""

echo "REALTUTORIALHUB-WEB Redis environment:"
docker exec realtutorialhub-web sh -c \
  'env | grep -E "^REDIS|^UPSTASH_REDIS" | sed "s/=.*$/=<REDACTED>/"' 2>/dev/null || echo "❌ Could not check realtutorialhub-web environment"
echo ""

echo "SKILLHUBCORE-SERVICE Redis environment:"
docker exec skillhubcore-service sh -c \
  'env | grep -E "^REDIS|^UPSTASH_REDIS" | sed "s/=.*$/=<REDACTED>/"' 2>/dev/null || echo "❌ Could not check skillhubcore-service environment"
echo ""

# Step 4: Test Upstash connectivity
echo "=== STEP 4: UPSTASH CONNECTIVITY TEST ==="
docker exec api-server sh -c '
if [ -n "$UPSTASH_REDIS_REST_URL" ]; then
  echo "UPSTASH_REDIS_REST_URL=SET"
  echo "Testing connectivity..."
  curl -sS -o /dev/null \
    -w "HTTP_CODE=%{http_code}\n" \
    "$UPSTASH_REDIS_REST_URL/ping" 2>&1 || echo "❌ Connectivity test failed"
else
  echo "❌ UPSTASH_REDIS_REST_URL=MISSING"
fi
' 2>/dev/null || echo "❌ Could not run connectivity test"
echo ""

# Step 5: Extract actual application errors
echo "=== STEP 5: APPLICATION REDIS ERRORS ==="
echo "API-SERVER Redis errors:"
docker logs api-server --tail 300 2>&1 | \
  grep -iE 'redis|upstash|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|NOAUTH|WRONGPASS|TLS|connection' | head -20 || echo "No Redis errors found"
echo ""

echo "REALTUTORIALHUB-WEB Redis errors:"
docker logs realtutorialhub-web --tail 300 2>&1 | \
  grep -iE 'redis|upstash|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|NOAUTH|WRONGPASS|TLS|connection' | head -20 || echo "No Redis errors found"
echo ""

echo "SKILLHUBCORE-SERVICE Redis errors:"
docker logs skillhubcore-service --tail 300 2>&1 | \
  grep -iE 'redis|upstash|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|NOAUTH|WRONGPASS|TLS|connection' | head -20 || echo "No Redis errors found"
echo ""

echo "========================================"
echo "DIAGNOSTIC COMPLETE"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Copy this output"
echo "2. Share it (tokens are already redacted)"
echo "3. We'll identify the exact issue and fix it"
