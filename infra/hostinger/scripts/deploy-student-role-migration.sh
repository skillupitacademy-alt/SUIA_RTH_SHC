#!/bin/bash

# Deployment script for "student" role migration
# This deploys the code changes that standardize all roles to "student"

set -e  # Exit on error

echo "🚀 Deploying Student Role Migration to VPS"
echo "=========================================="
echo ""

# Check if we're on VPS
if [ ! -f "/opt/platform/apps/quiz-platform/.git/config" ]; then
    echo "❌ Error: This script should be run on the VPS"
    echo "   Please SSH to VPS first: ssh hostinger-quiz-platform-root"
    exit 1
fi

cd /opt/platform/apps/quiz-platform

echo "📋 Step 1: Pull latest code changes"
git fetch origin
git pull origin main

echo ""
echo "📋 Step 2: Rebuild Docker images"
echo "   This will include the new signup.service.ts changes"
./infra/hostinger/scripts/build.sh

echo ""
echo "📋 Step 3: Restart affected containers"
docker compose -f infra/hostinger/compose/docker-compose.yml restart api-server
docker compose -f infra/hostinger/compose/docker-compose.yml restart realtutorialhub-web
docker compose -f infra/hostinger/compose/docker-compose.yml restart skillup-web

echo ""
echo "📋 Step 4: Wait for containers to be healthy"
sleep 10

echo ""
echo "📋 Step 5: Verify containers are running"
docker ps --filter "name=quiz-platform" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📝 What was deployed:"
echo "   - Signup now assigns 'student' role by default"
echo "   - Role unification changed from 'user' → 'student'"
echo "   - Backward compatible: existing 'user' roles still work"
echo ""
echo "🧪 Next steps:"
echo "   1. Test new signup on both brands"
echo "   2. Test existing users can still login"
echo "   3. Test yashicajoshi@gmail.com login (newly assigned role)"
echo ""
echo "📊 Monitor signup logs:"
echo "   docker logs -f quiz-platform-api-server-1 | grep SIGNUP"
echo ""
