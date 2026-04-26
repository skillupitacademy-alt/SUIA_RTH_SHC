#!/bin/bash
# 🔐 DEPLOY API SERVER WITH CANONICAL ROLE UNIFICATION
# 
# This deploys the API server with role canonicalization logic that unifies
# ["user", "student"] → ["user"] at runtime (logic level, not data level).

set -e

echo "========================================"
echo "🔐 CANONICAL ROLE UNIFICATION DEPLOY"
echo "========================================"
echo ""
echo "Changes being deployed:"
echo "  ✅ auth-context.ts - canonicalizeRoles() integrated"
echo "  ✅ rbac.service.ts - defensive canonicalization added"
echo "  ✅ Both brands will behave identically"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from project root"
  exit 1
fi

# Check if turbo is available
if ! command -v turbo &> /dev/null; then
  echo "❌ Error: turbo not found. Run: npm install -g turbo"
  exit 1
fi

echo "📦 Building API server..."
turbo run build --filter=api-server

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build successful"
echo ""

echo "🚀 Deploying to Vercel..."
cd apps/api-server

# Deploy to production
vercel --prod --yes

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed"
  exit 1
fi

cd ../..

echo ""
echo "========================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Run validation: npm run validate:rbac"
echo "  2. Check logs for 🔐 RBAC_CONTEXT[GATEWAY] and [JWT]"
echo "  3. Verify both brands return 200 for shared routes"
echo ""
echo "Expected behavior:"
echo "  RTH user (role: user) → canonicalized to ['user'] → 200 ✅"
echo "  SkillUp student (roles: user,student) → canonicalized to ['user'] → 200 ✅"
echo ""
