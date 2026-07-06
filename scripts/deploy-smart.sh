#!/bin/bash
set -euo pipefail

# ==============================================================================
# 🚀 deploy-smart.sh
# ==============================================================================
# Wrapper script around deploy-direct.sh to provide a clean, unified SRE
# command-line interface with dry-run support and specific service targeting.
# ==============================================================================

# Default configurations
export DEPLOY_ALL=false
export DRY_RUN=false
export OVERRIDE_BUILD_API=false
export OVERRIDE_BUILD_RTH=false
export OVERRIDE_BUILD_SKILLUP=false
export OVERRIDE_BUILD_SHC_ADMIN=false
export OVERRIDE_BUILD_SHC_API=false
export OVERRIDE_BUILD_ANALYTICS=false
export OVERRIDE_BUILD_RTH_SITE=false
export OVERRIDE_BUILD_SUIA_SITE=false

usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --all             Force build and deploy of all services"
  echo "  --api             Target and force deploy of API Server only"
  echo "  --rth             Target and force deploy of RealTutorialHub BFF only"
  echo "  --skillup         Target and force deploy of SkillUp BFF only"
  echo "  --shc-admin       Target and force deploy of SkillHubCore Admin only"
  echo "  --shc-api         Target and force deploy of SkillHubCore API only"
  echo "  --marketing       Target and force deploy of RealTutorialHub & SkillUp marketing sites"
  echo "  --dry-run         Print the build plan based on git diff without deploying"
  echo "  -h, --help        Show this help message"
  echo ""
  echo "Environment Overrides:"
  echo "  BUILD_MACHINE_TYPE  e2-medium (default), e2-highcpu-8 (for heavy builds)"
  echo "  LOG_LEVEL          info (default), warn (for production)"
  echo ""
  exit 1
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  # No arguments means smart auto-detection (default behavior)
  echo "🔍 Smart mode: Auto-detecting changes via git diff..."
else
  while [ $# -gt 0 ]; do
    case "$1" in
      --all)
        export DEPLOY_ALL=true
        shift
        ;;
      --api)
        export OVERRIDE_BUILD_API=true
        shift
        ;;
      --rth)
        export OVERRIDE_BUILD_RTH=true
        shift
        ;;
      --skillup)
        export OVERRIDE_BUILD_SKILLUP=true
        shift
        ;;
      --shc-admin)
        export OVERRIDE_BUILD_SHC_ADMIN=true
        shift
        ;;
      --shc-api)
        export OVERRIDE_BUILD_SHC_API=true
        shift
        ;;
      --marketing)
        export OVERRIDE_BUILD_RTH_SITE=true
        export OVERRIDE_BUILD_SUIA_SITE=true
        shift
        ;;
      --dry-run)
        export DRY_RUN=true
        shift
        ;;
      -h|--help)
        usage
        ;;
      *)
        echo "❌ Unknown option: $1"
        usage
        ;;
    esac
  done
fi

# Invoke the main deployment script with the parsed environment
./scripts/deploy-direct.sh
