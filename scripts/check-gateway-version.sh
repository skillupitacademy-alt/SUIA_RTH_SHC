#!/bin/bash

echo "🔍 CHECKING GATEWAY VERSION"
echo "Verifying which version is deployed"
echo ""

echo "Testing route matching behavior..."
echo ""

# Test a public route to see routing behavior
echo "1️⃣ Testing /api/health (public route)..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  https://user.realtutorialhub.com/api/health)

HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
echo "   Status: $HEALTH_STATUS"

if [ "$HEALTH_STATUS" = "200" ]; then
  echo "   ✅ Gateway is responding"
else
  echo "   ❌ Gateway issue"
fi

echo ""
echo "2️⃣ Testing /health (without /api prefix)..."
HEALTH2_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  https://user.realtutorialhub.com/health)

HEALTH2_STATUS=$(echo "$HEALTH2_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
echo "   Status: $HEALTH2_STATUS"

if [ "$HEALTH2_STATUS" = "200" ]; then
  echo "   ✅ Backward compatibility works"
else
  echo "   ⚠️  Backward compatibility may have issues"
fi

echo ""
echo "=========================================="
echo "📊 ANALYSIS"
echo "=========================================="
echo ""

if [ "$HEALTH_STATUS" = "200" ] && [ "$HEALTH2_STATUS" = "200" ]; then
  echo "✅ Gateway is deployed and working"
  echo "✅ Both /api/health and /health work (backward compatible)"
  echo ""
  echo "🔍 To verify the fix, check gateway logs with:"
  echo "   npx wrangler tail --env production"
  echo ""
  echo "Look for [GATEWAY_ROUTE_DEBUG] logs showing:"
  echo "   - /api/dashboard should match routePrefix=\"/api/dashboard\""
  echo "   - /api/profile should match routePrefix=\"/api/profile\""
  echo "   - /dashboard should match routePrefix=\"/\" (catch-all)"
else
  echo "⚠️  Gateway may not be fully deployed"
fi

echo ""
