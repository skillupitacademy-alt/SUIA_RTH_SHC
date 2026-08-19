#!/bin/bash
# Production Database Connection Diagnostic Script
# Purpose: Diagnose database connectivity issues in production container

set -e

echo "=================================================="
echo "DATABASE CONNECTION DIAGNOSTIC"
echo "=================================================="
echo ""

# Configuration
CONTAINER_NAME="quiz-platform-skillup-web-1"
ENV_FILES=(
    "/opt/platform/env/shared/.env"
    "/opt/platform/env/brands/skillup.env"
    "/opt/platform/env/services/skillup-web.env"
)

echo "[1/8] Container Status"
echo "-------------------------------------------"
docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.CreatedAt}}"
echo ""

echo "[2/8] Environment Variables Check"
echo "-------------------------------------------"
echo "Checking DATABASE_URL presence (value masked):"
docker exec $CONTAINER_NAME sh -c 'if [ -n "$DATABASE_URL" ]; then echo "✓ DATABASE_URL is set"; else echo "✗ DATABASE_URL is NOT set"; fi'
docker exec $CONTAINER_NAME sh -c 'if [ -n "$DATABASE_URL_TUTORIAL" ]; then echo "✓ DATABASE_URL_TUTORIAL is set"; else echo "✗ DATABASE_URL_TUTORIAL is NOT set"; fi'
echo ""

echo "[3/8] DATABASE_URL Format Check"
echo "-------------------------------------------"
echo "Format: (protocol masked)"
docker exec $CONTAINER_NAME sh -c 'echo $DATABASE_URL | sed -E "s/postgresql:\/\/[^:]+:[^@]+@/postgresql:\/\/USER:PASSWORD@/" | sed -E "s/(@[^\/]+)(\/.*)/\1\/.../"'
echo ""

echo "[4/8] Database Host Resolution (DNS Check)"
echo "-------------------------------------------"
DB_HOST=$(docker exec $CONTAINER_NAME sh -c 'echo $DATABASE_URL | sed -E "s/.*@([^:\/]+).*/\1/"')
echo "Database host: $DB_HOST"
echo "Testing DNS resolution:"
docker exec $CONTAINER_NAME sh -c "nslookup $DB_HOST 2>&1 || getent hosts $DB_HOST 2>&1 || echo 'DNS resolution failed'" || echo "DNS tools not available, skipping"
echo ""

echo "[5/8] Network Connectivity Test (TCP)"
echo "-------------------------------------------"
DB_PORT=$(docker exec $CONTAINER_NAME sh -c 'echo $DATABASE_URL | sed -E "s/.*:([0-9]+)\/.*/\1/" | grep -E "^[0-9]+$" || echo "5432"')
echo "Testing TCP connection to $DB_HOST:$DB_PORT"
docker exec $CONTAINER_NAME sh -c "timeout 5 nc -zv $DB_HOST $DB_PORT 2>&1" || echo "✗ TCP connection failed (nc might not be available)"
docker exec $CONTAINER_NAME sh -c "timeout 5 wget --spider -q -O /dev/null $DB_HOST:$DB_PORT 2>&1" || echo "Note: wget test inconclusive (expected for raw TCP)"
echo ""

echo "[6/8] PostgreSQL Connection Test"
echo "-------------------------------------------"
echo "Testing actual database connectivity with Node.js:"
docker exec $CONTAINER_NAME node -e "
const { Pool } = require('@neondatabase/serverless');

async function testConnection() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000,
        max: 1
    });

    try {
        console.log('Attempting connection...');
        const start = Date.now();
        const client = await pool.connect();
        const duration = Date.now() - start;
        console.log('✓ Connection successful! (' + duration + 'ms)');
        
        console.log('Testing query...');
        const result = await client.query('SELECT current_database(), current_user, version()');
        console.log('✓ Query successful!');
        console.log('  Database:', result.rows[0].current_database);
        console.log('  User:', result.rows[0].current_user);
        console.log('  Version:', result.rows[0].version.substring(0, 50) + '...');
        
        client.release();
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('✗ Connection failed:', err.message);
        console.error('Error code:', err.code);
        console.error('Error details:', {
            name: err.name,
            stack: err.stack ? err.stack.split('\\n')[0] : 'No stack'
        });
        await pool.end();
        process.exit(1);
    }
}

testConnection();
" 2>&1
TEST_RESULT=$?
echo ""

if [ $TEST_RESULT -eq 0 ]; then
    echo "✓ PostgreSQL connection test PASSED"
else
    echo "✗ PostgreSQL connection test FAILED"
fi
echo ""

echo "[7/8] Domains Table Query Test"
echo "-------------------------------------------"
echo "Testing the actual failing query from production logs:"
docker exec $CONTAINER_NAME node -e "
const { Pool } = require('@neondatabase/serverless');

async function testDomainsQuery() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000,
        max: 1
    });

    try {
        console.log('Querying domains table...');
        const result = await pool.query(
            'SELECT id, name, slug FROM domains WHERE deleted_at IS NULL LIMIT 5'
        );
        console.log('✓ Domains query successful!');
        console.log('  Found', result.rows.length, 'domain(s)');
        result.rows.forEach(row => {
            console.log('  -', row.name, '(' + row.slug + ')');
        });
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('✗ Domains query failed:', err.message);
        console.error('Error code:', err.code);
        await pool.end();
        process.exit(1);
    }
}

testDomainsQuery();
" 2>&1
QUERY_RESULT=$?
echo ""

if [ $QUERY_RESULT -eq 0 ]; then
    echo "✓ Domains query test PASSED"
else
    echo "✗ Domains query test FAILED"
fi
echo ""

echo "[8/8] Container Logs (Last 30 lines)"
echo "-------------------------------------------"
docker logs --tail 30 $CONTAINER_NAME 2>&1 | grep -E "(Error|error|ERROR|Connection|connection|Database|database|Failed|failed)" || echo "No recent error logs found"
echo ""

echo "=================================================="
echo "DIAGNOSTIC SUMMARY"
echo "=================================================="
echo ""

if [ $TEST_RESULT -eq 0 ] && [ $QUERY_RESULT -eq 0 ]; then
    echo "✓ ALL TESTS PASSED"
    echo ""
    echo "Database connectivity is working correctly."
    echo "The 503 error is likely caused by application logic,"
    echo "not database connectivity issues."
elif [ $TEST_RESULT -eq 0 ] && [ $QUERY_RESULT -ne 0 ]; then
    echo "⚠ PARTIAL SUCCESS"
    echo ""
    echo "Basic connection works, but domains query fails."
    echo "This suggests:"
    echo "  1. Connection to parent DB is working"
    echo "  2. Schema or permissions issue with domains table"
    echo "  3. Wrong database selected (check DATABASE_URL points to correct DB)"
elif [ $TEST_RESULT -ne 0 ]; then
    echo "✗ CONNECTION FAILED"
    echo ""
    echo "Database connection is not working."
    echo "Root causes to investigate:"
    echo "  1. DATABASE_URL format incorrect"
    echo "  2. Network/firewall blocking connection"
    echo "  3. Database credentials expired or invalid"
    echo "  4. Neon database not accessible from this IP"
    echo "  5. SSL/TLS configuration issue"
fi

echo ""
echo "=================================================="
echo "NEXT STEPS"
echo "=================================================="
echo ""

if [ $TEST_RESULT -ne 0 ]; then
    echo "1. Verify DATABASE_URL in env files:"
    for env_file in "${ENV_FILES[@]}"; do
        echo "   - $env_file"
    done
    echo ""
    echo "2. Check Neon database settings:"
    echo "   - IP allowlist (should include Hostinger VPS IP)"
    echo "   - Connection limits"
    echo "   - Database status (active/suspended)"
    echo ""
    echo "3. Test connection from host (not container):"
    echo "   psql <DATABASE_URL>"
fi

echo ""
echo "To view full environment files (contains secrets!):"
echo "  cat ${ENV_FILES[0]}"
echo ""
echo "To test connection manually:"
echo "  docker exec -it $CONTAINER_NAME sh"
echo "  node -e \"require('@neondatabase/serverless')...\""
echo ""
