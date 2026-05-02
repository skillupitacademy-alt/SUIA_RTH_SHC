#!/bin/bash
set -e

echo "🔍 RBAC FIX VERIFICATION SCRIPT"
echo "================================"
echo ""

echo "📋 Step 1: Fetch fresh tokens..."
node scripts/get-access-token.js

echo ""
echo "📋 Step 2: Run RBAC tests..."
node scripts/test-rbac-live.js

echo ""
echo "✅ Verification complete!"
echo ""
echo "🔍 Next: Check production logs for:"
echo "   - OWNERSHIP_DEBUG_PATCH"
echo "   - OWNERSHIP_CHECK"
echo "   - OWNERSHIP_RESULT"
echo "   - RBAC_AUDIT"
echo ""
echo "Must see BOTH:"
echo "   - result: GRANTED"
echo "   - result: DENIED"
