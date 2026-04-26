#!/bin/bash

echo "🧪 LIVE GATEWAY ROUTE TEST"
echo "Testing /api/dashboard and /api/profile routing"
echo ""

# Test RTH
echo "🔍 Testing RTH (user.realtutorialhub.com)"
echo "=========================================="

echo ""
echo "1️⃣ Login to RTH..."
RTH_LOGIN=$(curl -s -X POST https://user.realtutorialhub.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ajayshah@gmail.com","password":"testing"}' \
  -c /tmp/rth_cookies.txt \
  -b /tmp/rth_cookies.txt)

# Check if login was successful (either has accessToken or user object)
if echo "$RTH_LOGIN" | grep -q '"user"'; then
  echo "   ✅ Login successful (cookie-based auth)"
  
  # Extract accessToken from cookies file
  RTH_TOKEN=$(grep -o 'accessToken[[:space:]]*[^[:space:]]*' /tmp/rth_cookies.txt | awk '{print $2}')
  
  if [ -z "$RTH_TOKEN" ]; then
    echo "   ⚠️  No accessToken cookie found, trying to extract from response"
    RTH_TOKEN=$(echo "$RTH_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  fi
elif echo "$RTH_LOGIN" | grep -q '"accessToken"'; then
  echo "   ✅ Login successful (token-based auth)"
  RTH_TOKEN=$(echo "$RTH_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "   ❌ Login failed"
  echo "   Response: $RTH_LOGIN"
  RTH_TOKEN=""
fi

if [ -n "$RTH_TOKEN" ]; then
  
  echo ""
  echo "2️⃣ Testing /api/dashboard..."
  RTH_DASHBOARD=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    https://user.realtutorialhub.com/api/dashboard \
    -H "Cookie: accessToken=$RTH_TOKEN")
  
  RTH_DASH_STATUS=$(echo "$RTH_DASHBOARD" | grep "HTTP_STATUS:" | cut -d: -f2)
  RTH_DASH_BODY=$(echo "$RTH_DASHBOARD" | sed '/HTTP_STATUS:/d')
  
  echo "   Status: $RTH_DASH_STATUS"
  if [ "$RTH_DASH_STATUS" = "200" ]; then
    echo "   ✅ Dashboard API works"
  else
    echo "   ❌ Dashboard API failed"
    echo "   Response: $RTH_DASH_BODY"
  fi
  
  echo ""
  echo "3️⃣ Testing /api/profile..."
  RTH_PROFILE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    https://user.realtutorialhub.com/api/profile \
    -H "Cookie: accessToken=$RTH_TOKEN")
  
  RTH_PROF_STATUS=$(echo "$RTH_PROFILE" | grep "HTTP_STATUS:" | cut -d: -f2)
  RTH_PROF_BODY=$(echo "$RTH_PROFILE" | sed '/HTTP_STATUS:/d')
  
  echo "   Status: $RTH_PROF_STATUS"
  if [ "$RTH_PROF_STATUS" = "200" ]; then
    echo "   ✅ Profile API works"
  else
    echo "   ❌ Profile API failed"
    echo "   Response: $RTH_PROF_BODY"
  fi
fi

echo ""
echo ""
echo "🔍 Testing SkillUp (user.skillupitacademy.com)"
echo "=========================================="

echo ""
echo "1️⃣ Login to SkillUp..."
SKILLUP_LOGIN=$(curl -s -X POST https://user.skillupitacademy.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@skillupitacademy.com","password":"testing"}' \
  -c /tmp/skillup_cookies.txt \
  -b /tmp/skillup_cookies.txt)

# Check if login was successful (either has accessToken or user object)
if echo "$SKILLUP_LOGIN" | grep -q '"user"'; then
  echo "   ✅ Login successful (cookie-based auth)"
  
  # Extract accessToken from cookies file
  SKILLUP_TOKEN=$(grep -o 'accessToken[[:space:]]*[^[:space:]]*' /tmp/skillup_cookies.txt | awk '{print $2}')
  
  if [ -z "$SKILLUP_TOKEN" ]; then
    echo "   ⚠️  No accessToken cookie found, trying to extract from response"
    SKILLUP_TOKEN=$(echo "$SKILLUP_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  fi
elif echo "$SKILLUP_LOGIN" | grep -q '"accessToken"'; then
  echo "   ✅ Login successful (token-based auth)"
  SKILLUP_TOKEN=$(echo "$SKILLUP_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "   ❌ Login failed"
  echo "   Response: $SKILLUP_LOGIN"
  SKILLUP_TOKEN=""
fi

if [ -n "$SKILLUP_TOKEN" ]; then
  
  echo ""
  echo "2️⃣ Testing /api/dashboard..."
  SKILLUP_DASHBOARD=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    https://user.skillupitacademy.com/api/dashboard \
    -H "Cookie: accessToken=$SKILLUP_TOKEN")
  
  SKILLUP_DASH_STATUS=$(echo "$SKILLUP_DASHBOARD" | grep "HTTP_STATUS:" | cut -d: -f2)
  SKILLUP_DASH_BODY=$(echo "$SKILLUP_DASHBOARD" | sed '/HTTP_STATUS:/d')
  
  echo "   Status: $SKILLUP_DASH_STATUS"
  if [ "$SKILLUP_DASH_STATUS" = "200" ]; then
    echo "   ✅ Dashboard API works"
  else
    echo "   ❌ Dashboard API failed"
    echo "   Response: $SKILLUP_DASH_BODY"
  fi
  
  echo ""
  echo "3️⃣ Testing /api/profile..."
  SKILLUP_PROFILE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    https://user.skillupitacademy.com/api/profile \
    -H "Cookie: accessToken=$SKILLUP_TOKEN")
  
  SKILLUP_PROF_STATUS=$(echo "$SKILLUP_PROFILE" | grep "HTTP_STATUS:" | cut -d: -f2)
  SKILLUP_PROF_BODY=$(echo "$SKILLUP_PROFILE" | sed '/HTTP_STATUS:/d')
  
  echo "   Status: $SKILLUP_PROF_STATUS"
  if [ "$SKILLUP_PROF_STATUS" = "200" ]; then
    echo "   ✅ Profile API works"
  else
    echo "   ❌ Profile API failed"
    echo "   Response: $SKILLUP_PROF_BODY"
  fi
fi

echo ""
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo ""
echo "RTH:"
echo "  Dashboard: $RTH_DASH_STATUS"
echo "  Profile: $RTH_PROF_STATUS"
echo ""
echo "SkillUp:"
echo "  Dashboard: $SKILLUP_DASH_STATUS"
echo "  Profile: $SKILLUP_PROF_STATUS"
echo ""

# Cleanup
rm -f /tmp/rth_cookies.txt /tmp/skillup_cookies.txt

if [ "$RTH_DASH_STATUS" = "200" ] && [ "$RTH_PROF_STATUS" = "200" ] && \
   [ "$SKILLUP_DASH_STATUS" = "200" ] && [ "$SKILLUP_PROF_STATUS" = "200" ]; then
  echo "✅ ALL TESTS PASSED"
  echo "🎉 Gateway routing is working correctly!"
  exit 0
else
  echo "❌ SOME TESTS FAILED"
  echo "⚠️  Check the results above"
  exit 1
fi
