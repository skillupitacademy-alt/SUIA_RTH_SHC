#!/bin/bash

###############################################################################
# Clear Tutorial Cache Script for Hostinger Deployment
#
# This script clears Upstash Redis cache for tutorial delivery.
# Run this on Hostinger VPS/server where DNS resolution works.
#
# Usage:
#   ./scripts/clear-tutorial-cache-hostinger.sh <subtopic-slug>
#   ./scripts/clear-tutorial-cache-hostinger.sh whatisjava
#   ./scripts/clear-tutorial-cache-hostinger.sh all
#
# Prerequisites:
#   - Node.js installed on Hostinger
#   - .env.local with UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
#   - @upstash/redis package installed (pnpm install)
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   HOSTINGER: CLEAR TUTORIAL CACHE                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if subtopic slug is provided
if [ -z "$1" ]; then
  echo "❌ Usage: $0 <subtopic-slug|all>"
  echo ""
  echo "Examples:"
  echo "  $0 whatisjava"
  echo "  $0 what-is-java?"
  echo "  $0 all"
  exit 1
fi

SUBTOPIC_SLUG="$1"

echo "🌐 Environment: Hostinger VPS"
echo "📦 Subtopic: $SUBTOPIC_SLUG"
echo ""

# Check if .env.local exists
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
  echo "❌ .env.local not found at: $PROJECT_ROOT/.env.local"
  echo "   Upload .env.local to Hostinger first"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "⚠️  node_modules not found. Installing dependencies..."
  pnpm install
fi

# Run the cache clearing script
echo "🚀 Running cache clear script..."
echo ""

node "$SCRIPT_DIR/clear-tutorial-cache.mjs" "$SUBTOPIC_SLUG"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Cache cleared successfully on Hostinger!"
else
  echo ""
  echo "❌ Cache clearing failed with exit code: $EXIT_CODE"
  exit $EXIT_CODE
fi
