#!/bin/bash
set -e

# =============================================================================
# MULTI-ENVIRONMENT STRUCTURE DEPLOYMENT SCRIPT
# =============================================================================
# This script deploys the new multi-layer environment structure to VPS
# Following GCP Cloud Run pattern: shared + brand + service layers
# =============================================================================

echo "=================================================="
echo "🚀 Deploying Multi-Environment Structure"
echo "=================================================="

VPS_HOST="72.61.115.49"
VPS_USER="root"
VPS_PATH="/opt/platform/apps/quiz-platform"
ENV_BASE="/opt/platform/env"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# STEP 1: Create directory structure on VPS
# =============================================================================
echo ""
echo "${YELLOW}Step 1: Creating directory structure on VPS...${NC}"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e
cd /opt/platform/env

# Backup existing .env.production
if [ -f .env.production ]; then
    echo "📦 Backing up existing .env.production..."
    cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create new directory structure
echo "📁 Creating directory structure..."
mkdir -p shared
mkdir -p brands
mkdir -p services

echo "✅ Directory structure created"
ls -la
ENDSSH

echo "${GREEN}✓ Directory structure created${NC}"

# =============================================================================
# STEP 2: Copy environment files to VPS
# =============================================================================
echo ""
echo "${YELLOW}Step 2: Copying environment files to VPS...${NC}"

# Copy shared env
echo "  📄 Copying shared/.env..."
scp infra/hostinger/env/shared/.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/shared/.env

# Copy brand envs
echo "  📄 Copying brand configurations..."
scp infra/hostinger/env/brands/realtutorialhub.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/brands/realtutorialhub.env
scp infra/hostinger/env/brands/skillup.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/brands/skillup.env
scp infra/hostinger/env/brands/skillhubcore.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/brands/skillhubcore.env

# Copy service envs
echo "  📄 Copying service configurations..."
scp infra/hostinger/env/services/api-server.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/api-server.env
scp infra/hostinger/env/services/question-judge.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/question-judge.env
scp infra/hostinger/env/services/realtutorialhub-web.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/realtutorialhub-web.env
scp infra/hostinger/env/services/realtutorialhub-admin.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/realtutorialhub-admin.env
scp infra/hostinger/env/services/realtutorialhub-quiz.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/realtutorialhub-quiz.env
scp infra/hostinger/env/services/skillup-web.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/skillup-web.env
scp infra/hostinger/env/services/skillup-admin.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/skillup-admin.env
scp infra/hostinger/env/services/faculty-app.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/faculty-app.env
scp infra/hostinger/env/services/skillhubcore-admin.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/skillhubcore-admin.env
scp infra/hostinger/env/services/skillhubcore-service.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/skillhubcore-service.env
scp infra/hostinger/env/services/skillhub-placement.env ${VPS_USER}@${VPS_HOST}:${ENV_BASE}/services/skillhub-placement.env

echo "${GREEN}✓ Environment files copied${NC}"

# =============================================================================
# STEP 3: Copy updated docker-compose.yml to VPS
# =============================================================================
echo ""
echo "${YELLOW}Step 3: Copying updated docker-compose.yml...${NC}"

scp infra/hostinger/compose/docker-compose.yml ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/infra/hostinger/compose/docker-compose.yml

echo "${GREEN}✓ docker-compose.yml updated${NC}"

# =============================================================================
# STEP 4: Verify environment files on VPS
# =============================================================================
echo ""
echo "${YELLOW}Step 4: Verifying environment files on VPS...${NC}"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e
echo ""
echo "📋 Environment structure:"
tree /opt/platform/env -L 2 || ls -laR /opt/platform/env

echo ""
echo "🔍 Checking file sizes..."
echo "Shared:"
wc -l /opt/platform/env/shared/.env

echo ""
echo "Brands:"
wc -l /opt/platform/env/brands/*.env

echo ""
echo "Services:"
wc -l /opt/platform/env/services/*.env
ENDSSH

echo "${GREEN}✓ Verification complete${NC}"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "=================================================="
echo "${GREEN}✅ Multi-Environment Structure Deployed${NC}"
echo "=================================================="
echo ""
echo "📁 Structure:"
echo "   /opt/platform/env/"
echo "   ├── shared/.env              (Infrastructure)"
echo "   ├── brands/"
echo "   │   ├── realtutorialhub.env  (RTH brand)"
echo "   │   ├── skillup.env          (SUIA brand)"
echo "   │   └── skillhubcore.env     (SHC brand)"
echo "   └── services/"
echo "       ├── api-server.env"
echo "       ├── question-judge.env"
echo "       ├── realtutorialhub-web.env"
echo "       ├── skillup-web.env"
echo "       └── ... (all services)"
echo ""
echo "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "   1. SSH to VPS: ssh ${VPS_USER}@${VPS_HOST}"
echo "   2. Navigate to: cd ${VPS_PATH}"
echo "   3. Rebuild containers: ./infra/hostinger/scripts/build.sh"
echo "   4. Deploy: ./infra/hostinger/scripts/deploy.sh"
echo "   5. Test brand-specific URLs work correctly"
echo ""
echo "🧪 Test commands:"
echo "   # Check SUIA container env"
echo "   docker exec quiz-platform-skillup-web-1 env | grep NEXT_PUBLIC"
echo ""
echo "   # Check RTH container env"
echo "   docker exec quiz-platform-realtutorialhub-web-1 env | grep NEXT_PUBLIC"
echo ""
