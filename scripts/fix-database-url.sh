#!/bin/bash
# Fix DATABASE_URL configuration - Remove channel_binding parameter
# This parameter causes "Connection terminated unexpectedly" errors with Neon pooler

set -e

echo "=================================================="
echo "DATABASE_URL CONFIGURATION FIX"
echo "=================================================="
echo ""

ENV_FILE="/opt/platform/env/shared/.env"
BACKUP_FILE="/opt/platform/env/shared/.env.backup-$(date +%Y%m%d-%H%M%S)"

echo "[1/4] Creating backup of env file..."
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✓ Backup created: $BACKUP_FILE"
echo ""

echo "[2/4] Current DATABASE_URL (masked):"
grep "^DATABASE_URL=" "$ENV_FILE" | sed 's/=postgresql:\/\/[^:]*:[^@]*@/=postgresql:\/\/USER:****@/' | sed 's/\?.*/?.../'
echo ""

echo "[3/4] Removing channel_binding parameter..."
# Remove &channel_binding=require from all DATABASE_URL variables
sed -i 's/&channel_binding=require//g' "$ENV_FILE"
sed -i 's/\?channel_binding=require&/?/g' "$ENV_FILE"
sed -i 's/\?channel_binding=require"/"/' "$ENV_FILE"
echo "✓ Parameter removed"
echo ""

echo "[4/4] New DATABASE_URL (masked):"
grep "^DATABASE_URL=" "$ENV_FILE" | sed 's/=postgresql:\/\/[^:]*:[^@]*@/=postgresql:\/\/USER:****@/' | sed 's/\?.*/?.../'
echo ""

echo "=================================================="
echo "FIX APPLIED SUCCESSFULLY"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Restart the skillup-web container:"
echo "     cd /opt/platform"
echo "     docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml restart skillup-web"
echo ""
echo "  2. Test the tutorial page:"
echo "     curl http://localhost:3004/tutorial/full-stack-development/backend-development/java/what-is-java"
echo ""
echo "  3. Check logs:"
echo "     docker logs --tail 50 quiz-platform-skillup-web-1"
echo ""
