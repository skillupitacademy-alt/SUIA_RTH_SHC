#!/bin/bash

# SkillHubCore Educational Hierarchy Migration Setup Script
# This script automates the initial setup for the migration

set -e

echo "🚀 Starting SkillHubCore Migration Setup..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create database package
echo -e "\n${GREEN}Step 1: Creating db-skillhubcore package${NC}"
mkdir -p packages/db-skillhubcore/src/schema
mkdir -p packages/db-skillhubcore/drizzle

# Step 2: Copy schema files
echo -e "\n${GREEN}Step 2: Copying database schemas${NC}"
cp packages/db/src/schema/enums.ts packages/db-skillhubcore/src/schema/
cp packages/db/src/schema/domain.ts packages/db-skillhubcore/src/schema/
cp packages/db/src/schema/auth.ts packages/db-skillhubcore/src/schema/
cp packages/db/src/schema/relations.ts packages/db-skillhubcore/src/schema/

# Step 3: Copy type definitions
echo -e "\n${GREEN}Step 3: Copying type definitions${NC}"
mkdir -p apps/skillhubcore-admin/src/types
cp apps/realtutorialhub-admin/src/types/domain.ts apps/skillhubcore-admin/src/types/
cp apps/realtutorialhub-admin/src/types/review.ts apps/skillhubcore-admin/src/types/
cp apps/realtutorialhub-admin/src/types/factory.ts apps/skillhubcore-admin/src/types/

# Step 4: Copy components
echo -e "\n${GREEN}Step 4: Copying components${NC}"
mkdir -p apps/skillhubcore-admin/src/components/questions
mkdir -p apps/skillhubcore-admin/src/components/content
mkdir -p apps/skillhubcore-admin/src/components/entry
mkdir -p apps/skillhubcore-admin/src/components/layout
mkdir -p apps/skillhubcore-admin/src/components/auth
mkdir -p apps/skillhubcore-admin/src/components/ui

cp -r apps/realtutorialhub-admin/src/components/questions/* apps/skillhubcore-admin/src/components/questions/
cp apps/realtutorialhub-admin/src/components/content/HierarchyFactoryWizard.tsx apps/skillhubcore-admin/src/components/content/
cp -r apps/realtutorialhub-admin/src/components/entry/* apps/skillhubcore-admin/src/components/entry/
cp apps/realtutorialhub-admin/src/components/layout/ErrorBanner.tsx apps/skillhubcore-admin/src/components/layout/
cp -r apps/realtutorialhub-admin/src/components/ui/* apps/skillhubcore-admin/src/components/ui/

# Step 5: Copy hooks
echo -e "\n${GREEN}Step 5: Copying hooks${NC}"
mkdir -p apps/skillhubcore-admin/src/hooks
cp apps/realtutorialhub-admin/src/hooks/useAdminHierarchy.ts apps/skillhubcore-admin/src/hooks/

# Step 6: Create API routes structure
echo -e "\n${GREEN}Step 6: Creating API routes structure${NC}"
mkdir -p apps/skillhubcore-admin/src/app/api/admin/domains
mkdir -p apps/skillhubcore-admin/src/app/api/admin/subjects
mkdir -p apps/skillhubcore-admin/src/app/api/admin/topics
mkdir -p apps/skillhubcore-admin/src/app/api/admin/subtopics
mkdir -p apps/skillhubcore-admin/src/app/api/admin/skills
mkdir -p apps/skillhubcore-admin/src/app/api/admin/atomic-seed

# Step 7: Create pages structure
echo -e "\n${GREEN}Step 7: Creating pages structure${NC}"
mkdir -p apps/skillhubcore-admin/src/app/\(admin\)/questions
mkdir -p apps/skillhubcore-admin/src/app/\(admin\)/dashboard
mkdir -p apps/skillhubcore-admin/src/app/\(public\)/login

echo -e "\n${GREEN}✅ Migration setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Set up database connection in .env.local"
echo "2. Install dependencies: pnpm install"
echo "3. Run database migrations: pnpm --filter @quiz/db-skillhubcore db:migrate"
echo "4. Start development: pnpm --filter @quiz/skillhubcore-admin dev"
echo ""
echo "📚 Refer to SKILLHUBCORE_HIERARCHY_MIGRATION_ROADMAP.md for detailed instructions"
