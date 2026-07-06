#!/usr/bin/env sh
# Validate deployment configuration files
# Usage: ./validate-config.sh

set -e

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Validating deployment configuration..."
echo ""

VALIDATION_FAILED=0

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
  echo "${YELLOW}⚠️  jq not installed - skipping JSON validation${NC}"
  echo "   Install with: apt-get install jq"
  exit 0
fi

# Validate deployment-config.json
echo "📋 deployment-config.json"
if [ -f "$CONFIG_DIR/deployment-config.json" ]; then
  if jq empty "$CONFIG_DIR/deployment-config.json" 2>/dev/null; then
    echo "   ${GREEN}✓${NC} Valid JSON"
    
    # Check required fields
    VERSION=$(jq -r '.version' "$CONFIG_DIR/deployment-config.json")
    if [ "$VERSION" = "3.0" ]; then
      echo "   ${GREEN}✓${NC} Version: $VERSION"
    else
      echo "   ${RED}✗${NC} Invalid version: $VERSION (expected 3.0)"
      VALIDATION_FAILED=1
    fi
    
    # Check deployment settings
    STATE_DIR=$(jq -r '.deployment.state_directory' "$CONFIG_DIR/deployment-config.json")
    if [ -n "$STATE_DIR" ]; then
      echo "   ${GREEN}✓${NC} State directory: $STATE_DIR"
    else
      echo "   ${RED}✗${NC} Missing state_directory"
      VALIDATION_FAILED=1
    fi
  else
    echo "   ${RED}✗${NC} Invalid JSON"
    VALIDATION_FAILED=1
  fi
else
  echo "   ${RED}✗${NC} File not found"
  VALIDATION_FAILED=1
fi

echo ""

# Validate service-map.json
echo "🗺️  service-map.json"
if [ -f "$CONFIG_DIR/service-map.json" ]; then
  if jq empty "$CONFIG_DIR/service-map.json" 2>/dev/null; then
    echo "   ${GREEN}✓${NC} Valid JSON"
    
    # Check version
    VERSION=$(jq -r '.version' "$CONFIG_DIR/service-map.json")
    if [ "$VERSION" = "3.0" ]; then
      echo "   ${GREEN}✓${NC} Version: $VERSION"
    else
      echo "   ${RED}✗${NC} Invalid version: $VERSION (expected 3.0)"
      VALIDATION_FAILED=1
    fi
    
    # Count services
    SERVICE_COUNT=$(jq '.services | length' "$CONFIG_DIR/service-map.json")
    echo "   ${GREEN}✓${NC} Services defined: $SERVICE_COUNT"
    
    # Validate each service has required fields
    jq -r '.services | keys[]' "$CONFIG_DIR/service-map.json" | while read -r service; do
      NAME=$(jq -r ".services[\"$service\"].name" "$CONFIG_DIR/service-map.json")
      SOURCE=$(jq -r ".services[\"$service\"].source_path" "$CONFIG_DIR/service-map.json")
      
      if [ "$NAME" = "null" ] || [ "$SOURCE" = "null" ]; then
        echo "   ${RED}✗${NC} Service $service missing required fields"
        VALIDATION_FAILED=1
      else
        echo "   ${GREEN}✓${NC} $service ($SOURCE)"
      fi
    done
  else
    echo "   ${RED}✗${NC} Invalid JSON"
    VALIDATION_FAILED=1
  fi
else
  echo "   ${RED}✗${NC} File not found"
  VALIDATION_FAILED=1
fi

echo ""

# Validate smoke-tests.json
echo "🧪 smoke-tests.json"
if [ -f "$CONFIG_DIR/smoke-tests.json" ]; then
  if jq empty "$CONFIG_DIR/smoke-tests.json" 2>/dev/null; then
    echo "   ${GREEN}✓${NC} Valid JSON"
    
    # Check version
    VERSION=$(jq -r '.version' "$CONFIG_DIR/smoke-tests.json")
    if [ "$VERSION" = "3.0" ]; then
      echo "   ${GREEN}✓${NC} Version: $VERSION"
    else
      echo "   ${RED}✗${NC} Invalid version: $VERSION (expected 3.0)"
      VALIDATION_FAILED=1
    fi
    
    # Count tests
    TEST_COUNT=$(jq '.tests | length' "$CONFIG_DIR/smoke-tests.json")
    echo "   ${GREEN}✓${NC} Tests defined: $TEST_COUNT"
    
    # Validate each test has required fields
    jq -r '.tests | keys[]' "$CONFIG_DIR/smoke-tests.json" | while read -r test; do
      URL=$(jq -r ".tests[\"$test\"].url" "$CONFIG_DIR/smoke-tests.json")
      METHOD=$(jq -r ".tests[\"$test\"].method" "$CONFIG_DIR/smoke-tests.json")
      
      if [ "$URL" = "null" ] || [ "$METHOD" = "null" ]; then
        echo "   ${RED}✗${NC} Test $test missing required fields"
        VALIDATION_FAILED=1
      fi
    done
    
    # Count required tests
    REQUIRED_COUNT=$(jq '[.tests[] | select(.required == true)] | length' "$CONFIG_DIR/smoke-tests.json")
    echo "   ${GREEN}✓${NC} Required tests: $REQUIRED_COUNT"
  else
    echo "   ${RED}✗${NC} Invalid JSON"
    VALIDATION_FAILED=1
  fi
else
  echo "   ${RED}✗${NC} File not found"
  VALIDATION_FAILED=1
fi

echo ""

# Summary
if [ $VALIDATION_FAILED -eq 0 ]; then
  echo "${GREEN}✅ All configuration files are valid${NC}"
  exit 0
else
  echo "${RED}❌ Configuration validation failed${NC}"
  exit 1
fi
