#!/bin/bash
# Local verification script for migration fix
# Tests that duplicate enums have been removed

set -e

echo "=== Migration Fix Verification Script ==="
echo ""

# Check if we're in the right directory
if [ ! -f "packages/db-tutorial/migrations/0003_flawless_surge.sql" ]; then
    echo "❌ ERROR: Not in repository root. Please run from repository root."
    exit 1
fi

echo "✓ Repository structure verified"
echo ""

# Extract enum names from migration 0003
echo "📋 Extracting enums from migration 0003..."
grep "^CREATE TYPE" packages/db-tutorial/migrations/0003_flawless_surge.sql | \
    sed 's/.*"public"\."//; s/".*//' | sort > /tmp/enums-0003.txt

ENUM_COUNT_0003=$(wc -l < /tmp/enums-0003.txt)
echo "   Found $ENUM_COUNT_0003 enums in migration 0003"
echo ""

# Extract enum names from migration 0012
echo "📋 Extracting enums from migration 0012..."
grep "^CREATE TYPE" packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql | \
    sed 's/.*"public"\."//; s/".*//' | sort > /tmp/enums-0012.txt

ENUM_COUNT_0012=$(wc -l < /tmp/enums-0012.txt)
echo "   Found $ENUM_COUNT_0012 enums in migration 0012"
echo ""

# Find duplicates
echo "🔍 Checking for duplicates..."
DUPLICATES=$(comm -12 /tmp/enums-0003.txt /tmp/enums-0012.txt)

if [ -z "$DUPLICATES" ]; then
    echo "✅ SUCCESS: No duplicate enums found!"
    echo ""
    echo "Migration 0003 enums:"
    cat /tmp/enums-0003.txt | sed 's/^/  - /'
    echo ""
    echo "Migration 0012 enums:"
    cat /tmp/enums-0012.txt | sed 's/^/  - /'
    echo ""
    echo "✓ Fix verified - ready to push to GitHub"
    exit 0
else
    echo "❌ FAILURE: Found duplicate enums:"
    echo "$DUPLICATES" | sed 's/^/  - /'
    echo ""
    echo "These enums exist in BOTH migration 0003 and 0012."
    echo "They must be removed from migration 0012."
    exit 1
fi
