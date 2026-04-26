#!/bin/bash
#
# AUTOMATED GATEWAY DEPLOY + RBAC TEST
# 
# This script:
# 1. Deploys gateway changes
# 2. Waits for deployment
# 3. Runs RBAC tests
# 4. Fails if not 100% pass rate
#

set -e  # Exit on any error

echo ""
echo "======================================================================"
echo "AUTOMATED GATEWAY DEPLOY + RBAC TEST"
echo "======================================================================"
echo ""

# Step 1: Deploy Gateway
echo "[STEP 1/4] Deploying gateway to production..."
echo ""
cd services/api-gateway
npx wrangler deploy --env production

if [ $? -ne 0 ]; then
  echo ""
  echo "[FAIL] Gateway deployment failed"
  exit 1
fi

echo ""
echo "[OK] Gateway deployed successfully"
echo ""

# Step 2: Wait for deployment to propagate
echo "[STEP 2/4] Waiting for deployment to propagate (90 seconds)..."
echo ""
for i in {90..1}; do
  printf "\r[WAIT] %02d seconds remaining..." $i
  sleep 1
done
printf "\r[OK] Deployment propagated                    \n"
echo ""

# Step 3: Return to root and run tests
echo "[STEP 3/4] Running RBAC tests..."
echo ""
cd ../..
node scripts/test-rbac-shared-components.js

TEST_RESULT=$?

echo ""

# Step 4: Check results
if [ $TEST_RESULT -eq 0 ]; then
  echo "======================================================================"
  echo "[SUCCESS] ALL TESTS PASSED - SAFE TO USE"
  echo "======================================================================"
  echo ""
  echo "[OK] Gateway routing is correct"
  echo "[OK] RBAC is enforcing properly"
  echo "[OK] Both brands are secure"
  echo ""
  echo "[NEXT] Verify production logs:"
  echo "  cd services/api-gateway"
  echo "  npx wrangler tail --env production"
  echo ""
  echo "  Must see BOTH:"
  echo "    RBAC_AUDIT -> \"result\":\"GRANTED\""
  echo "    RBAC_AUDIT -> \"result\":\"DENIED\""
  echo ""
  exit 0
else
  echo "======================================================================"
  echo "[FAIL] TESTS FAILED - DO NOT USE IN PRODUCTION"
  echo "======================================================================"
  echo ""
  echo "[ERROR] Some tests failed"
  echo "[ACTION] Review failures above"
  echo "[ACTION] Check gateway logs:"
  echo "  cd services/api-gateway"
  echo "  npx wrangler tail --env production"
  echo ""
  exit 1
fi
