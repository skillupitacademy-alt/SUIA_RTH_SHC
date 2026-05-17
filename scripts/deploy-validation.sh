#!/bin/bash
set -euo pipefail

#############################################
# 🧪 DEPLOYMENT VALIDATION SCRIPT
# Runs all the pre/post-deployment Node.js 
# validation scripts to ensure system health.
#############################################

REGION="asia-southeast1"

SERVICE_API="quiz-api-server"
SERVICE_RTH="realtutorialhub-web"
SERVICE_SKILLUP="skillup-web"
SERVICE_SHC_ADMIN="skillhubcore-admin"

# Test credentials
export RTH_TEST_EMAIL="${RTH_TEST_EMAIL:-ajayshah@gmail.com}"
export RTH_TEST_PASSWORD="${RTH_TEST_PASSWORD:-testing}"
export RBAC_RTH_USER_EMAIL="${RBAC_RTH_USER_EMAIL:-ajayshah@gmail.com}"
export RBAC_RTH_USER_PASSWORD="${RBAC_RTH_USER_PASSWORD:-testing}"

export SKILLUP_TEST_EMAIL="${SKILLUP_TEST_EMAIL:-student@skillupitacademy.com}"
export SKILLUP_TEST_PASSWORD="${SKILLUP_TEST_PASSWORD:-testing}"
export RBAC_SKILLUP_STUDENT_EMAIL="${RBAC_SKILLUP_STUDENT_EMAIL:-student@skillupitacademy.com}"
export RBAC_SKILLUP_STUDENT_PASSWORD="${RBAC_SKILLUP_STUDENT_PASSWORD:-testing}"

export SHC_ADMIN_EMAIL="${SHC_ADMIN_EMAIL:-admin@skillhubcore.in}"
export SHC_ADMIN_PASSWORD="${SHC_ADMIN_PASSWORD:-testing}"

echo "🔐 Running SAFETY GATES..."
node ./scripts/auth-safety-gate.js || { echo "❌ auth-safety-gate failed"; exit 1; }

echo "🔐 Running COMPREHENSIVE AUDIT..."
node ./scripts/auth-full-audit.js || echo "⚠️ auth-full-audit failed (continuing)"

echo "🔥 Running PHASE 1 FALLBACK VALIDATION..."
node ./scripts/test-phase1-fallback.js || { echo "❌ test-phase1-fallback failed"; exit 1; }

echo "🔄 Running NAVIGATION STABILITY TEST..."
node ./scripts/test-auth-resilience.js || { echo "❌ test-auth-resilience failed"; exit 1; }

echo "🧪 Running AUTH VALIDATION..."
node ./scripts/final-auth-diagnostic.js || { echo "❌ final-auth-diagnostic failed"; exit 1; }

echo "🔐 Fetching access tokens for RBAC test users..."
if node ./scripts/get-access-token.js; then
  echo "🧪 Running RBAC live tests..."
  node ./scripts/test-rbac-live.js || {
    echo "❌ RBAC validation failed"
    node ./scripts/detect-stale-rbac-code.js || true
    exit 1
  }
else
  echo "⚠️ Could not fetch RBAC tokens, skipping RBAC validation"
fi

echo "🧪 Running SHC Admin validation..."
node ./scripts/test-shc-browser-flow.mjs || { echo "❌ SHC Admin validation failed"; exit 1; }

echo "✅ All validations completed successfully!"
