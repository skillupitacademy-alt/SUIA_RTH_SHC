#!/bin/bash
# Test Neon Pooler Connection Directly
# This tests the pooler endpoint independently of the Next.js application

set -e

echo "=================================================="
echo "NEON POOLER DIRECT CONNECTION TEST"
echo "=================================================="
echo ""

# Read DATABASE_URL from env file (clean all whitespace and quotes)
ENV_FILE="/opt/platform/env/shared/.env"
DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"\r\n' | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in $ENV_FILE"
    exit 1
fi

# Extract database name for display (masked)
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's#.*/([^?]+).*#\1#')
POOLER_HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^/]+)/.*#\1#')

echo "Testing connection to:"
echo "  Database: $DB_NAME"
echo "  Pooler: $POOLER_HOST"
echo ""

echo "[Test 1/4] Basic Connection Test"
echo "-------------------------------------------"
docker run --rm postgres:15-alpine psql "$DATABASE_URL" -c "SELECT 1 AS test;" 2>&1
TEST1_RESULT=$?
if [ $TEST1_RESULT -eq 0 ]; then
    echo "✓ Basic connection successful"
else
    echo "❌ Basic connection failed (exit code: $TEST1_RESULT)"
fi
echo ""

if [ $TEST1_RESULT -ne 0 ]; then
    echo "❌ Cannot proceed - pooler connection failed"
    echo ""
    echo "Possible causes:"
    echo "  1. Neon database is suspended/paused"
    echo "  2. IP address blocked by Neon"
    echo "  3. Credentials expired/invalid"
    echo "  4. Network/firewall issue"
    exit 1
fi

echo "[Test 2/4] Database Info"
echo "-------------------------------------------"
docker run --rm postgres:15-alpine psql "$DATABASE_URL" -c "SELECT current_database(), current_user, version();" 2>&1
echo ""

echo "[Test 3/4] Domains Table Count"
echo "-------------------------------------------"
docker run --rm postgres:15-alpine psql "$DATABASE_URL" -c "SELECT COUNT(*) as domain_count FROM domains;" 2>&1
TEST3_RESULT=$?
echo ""

echo "[Test 4/4] Exact Production Query (Failing in Next.js)"
echo "-------------------------------------------"
docker run --rm postgres:15-alpine psql "$DATABASE_URL" -c "SELECT id, name, description, category, status, \"order\", created_at, updated_at, deleted_at FROM domains WHERE deleted_at IS NULL LIMIT 5;" 2>&1
TEST4_RESULT=$?
echo ""

echo "=================================================="
echo "TEST SUMMARY"
echo "=================================================="
echo ""

if [ $TEST1_RESULT -eq 0 ] && [ $TEST3_RESULT -eq 0 ] && [ $TEST4_RESULT -eq 0 ]; then
    echo "✓ ALL TESTS PASSED"
    echo ""
    echo "CONCLUSION:"
    echo "  The Neon pooler is working correctly."
    echo "  The exact production query succeeds from psql."
    echo "  The problem is NOT the pooler or database."
    echo ""
    echo "  The issue is in the Node.js/Drizzle layer:"
    echo "    - Connection configuration"
    echo "    - SSL/TLS settings"
    echo "    - Connection pooling"
    echo "    - Timeout settings"
    echo ""
else
    echo "❌ SOME TESTS FAILED"
    echo ""
    echo "CONCLUSION:"
    echo "  The pooler itself has connectivity issues."
    echo "  This is the root cause of the Next.js failures."
fi

echo ""
