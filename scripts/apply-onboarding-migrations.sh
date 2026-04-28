#!/bin/bash

# Apply onboarding field migrations to both SkillUp and RTH databases

set -e

echo "🔄 Applying onboarding field migrations..."

# SkillUp Database
echo ""
echo "📦 SkillUp Database Migration"
echo "================================"
cd packages/db-skillup
npm run db:migrate
cd ../..

# RTH Database
echo ""
echo "📦 RTH Database Migration"
echo "================================"
cd packages/db-rth
npm run db:migrate
cd ../..

echo ""
echo "✅ All migrations applied successfully!"
echo ""
echo "📋 Summary:"
echo "  - Added onboarding fields to users table"
echo "  - Added onboarding fields to user_profiles table"
echo "  - Both SkillUp and RTH databases are now in sync"
