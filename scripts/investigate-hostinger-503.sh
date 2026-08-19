#!/bin/bash
#
# Hostinger Production 503 Investigation Script
# 
# This script investigates the 503 error on:
# https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava
#
# READ-ONLY investigation - does NOT restart services or modify configuration
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}HOSTINGER PRODUCTION 503 INVESTIGATION${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GRAY}URL: https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 1: Infrastructure Status
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 1: Infrastructure Status${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Hostname:${NC}"
hostname
echo ""

echo -e "${GRAY}System Info:${NC}"
uname -a
echo ""

echo -e "${GRAY}Uptime:${NC}"
uptime
echo ""

echo -e "${GRAY}Docker Version:${NC}"
docker version --format 'Client: {{.Client.Version}} | Server: {{.Server.Version}}'
echo ""

echo -e "${GRAY}Docker Compose Version:${NC}"
docker compose version
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 2: Container Status
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 2: Container Status${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Docker Compose Services:${NC}"
cd /opt/platform
docker compose -f compose/docker-compose.yml -f compose/docker-compose.production.yml ps
echo ""

echo -e "${GRAY}All Running Containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Find skillup-web container
SKILLUP_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i skillup-web || echo "NOT_FOUND")

if [ "$SKILLUP_CONTAINER" = "NOT_FOUND" ]; then
    echo -e "${RED}ERROR: skillup-web container not found!${NC}"
    echo ""
    echo -e "${GRAY}All containers:${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo -e "${GREEN}Found skillup-web container: $SKILLUP_CONTAINER${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 3: Container Health
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 3: Container Health Check${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Container Inspection:${NC}"
docker inspect "$SKILLUP_CONTAINER" --format '
Image: {{.Config.Image}}
ImageID: {{.Image}}
Created: {{.Created}}
Started: {{.State.StartedAt}}
Status: {{.State.Status}}
Running: {{.State.Running}}
Restarting: {{.State.Restarting}}
RestartCount: {{.RestartCount}}
ExitCode: {{.State.ExitCode}}
OOMKilled: {{.State.OOMKilled}}
'
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 4: Environment Variables Check (SAFE)
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 4: Environment Variables Check (No Secrets)${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Checking critical environment variables (showing only presence):${NC}"
docker exec "$SKILLUP_CONTAINER" sh -c '
echo "DATABASE_URL=$([ -n "$DATABASE_URL" ] && echo "SET" || echo "MISSING")"
echo "DATABASE_URL_TUTORIAL=$([ -n "$DATABASE_URL_TUTORIAL" ] && echo "SET" || echo "MISSING")"
echo "NODE_ENV=$([ -n "$NODE_ENV" ] && echo "$NODE_ENV" || echo "MISSING")"
echo "NEXT_PUBLIC_API_URL=$([ -n "$NEXT_PUBLIC_API_URL" ] && echo "SET" || echo "MISSING")"
'
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 5: Container Port Mapping
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 5: Port Mapping${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Container Ports:${NC}"
docker inspect "$SKILLUP_CONTAINER" --format '{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}}{{"\n"}}{{end}}'
echo ""

# Get the exposed port
CONTAINER_PORT=$(docker inspect "$SKILLUP_CONTAINER" --format '{{range $p, $conf := .NetworkSettings.Ports}}{{if index $conf 0}}{{(index $conf 0).HostPort}}{{end}}{{end}}' | head -n1)

if [ -z "$CONTAINER_PORT" ]; then
    echo -e "${YELLOW}WARNING: Could not detect exposed port, checking internal port${NC}"
    CONTAINER_PORT=$(docker inspect "$SKILLUP_CONTAINER" --format '{{range $p, $conf := .Config.ExposedPorts}}{{$p}}{{end}}' | cut -d'/' -f1)
fi

echo -e "${GREEN}Detected port: $CONTAINER_PORT${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 6: Direct Container Test
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 6: Direct Container Test (CRITICAL)${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Testing direct request to skillup-web container:${NC}"
echo -e "${GRAY}URL: http://localhost:$CONTAINER_PORT/tutorial-v2/full-stack-development/backend-development/java/whatisjava${NC}"
echo ""

DIRECT_RESPONSE=$(curl -s -o /tmp/skillup-direct-response.html -w "%{http_code}" \
    http://localhost:$CONTAINER_PORT/tutorial-v2/full-stack-development/backend-development/java/whatisjava 2>&1 || echo "FAILED")

echo -e "${GRAY}Direct container response: HTTP $DIRECT_RESPONSE${NC}"

if [ "$DIRECT_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Direct container request: SUCCESS (HTTP 200)${NC}"
    echo -e "${GRAY}Response body saved to: /tmp/skillup-direct-response.html${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Direct container works but public URL returns 503${NC}"
    echo -e "${YELLOW}This indicates a Nginx/Cloudflare routing issue, NOT application code${NC}"
elif [ "$DIRECT_RESPONSE" = "503" ]; then
    echo -e "${RED}✗ Direct container request: FAILED (HTTP 503)${NC}"
    echo -e "${RED}The application itself is returning 503 - this is an application error${NC}"
    echo -e "${GRAY}Response body saved to: /tmp/skillup-direct-response.html${NC}"
else
    echo -e "${RED}✗ Direct container request: FAILED (HTTP $DIRECT_RESPONSE)${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 7: Container Logs (MOST IMPORTANT)
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 7: Container Logs (Last 100 lines)${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Recent logs from $SKILLUP_CONTAINER:${NC}"
docker logs --tail 100 "$SKILLUP_CONTAINER" 2>&1
echo ""

# Make another request and capture fresh logs
echo -e "${GRAY}Making test request and capturing fresh logs...${NC}"
curl -s http://localhost:$CONTAINER_PORT/tutorial-v2/full-stack-development/backend-development/java/whatisjava > /dev/null 2>&1 || true
sleep 2
echo ""
echo -e "${GRAY}Fresh logs (last 50 lines):${NC}"
docker logs --tail 50 "$SKILLUP_CONTAINER" 2>&1 | grep -A 10 -B 10 -E "(Error|Exception|TypeError|Cannot|undefined|null|503|Tutorial|Sidebar|withRuntimeBrand)" || echo "No error patterns found in recent logs"
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 8: Nginx Check
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 8: Nginx Status${NC}"
echo "───────────────────────────────────────────────────────────────"

# Check if Nginx is running as container or host service
NGINX_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i nginx || echo "")

if [ -n "$NGINX_CONTAINER" ]; then
    echo -e "${GREEN}Nginx running as container: $NGINX_CONTAINER${NC}"
    echo ""
    echo -e "${GRAY}Nginx container logs (last 50 lines):${NC}"
    docker logs --tail 50 "$NGINX_CONTAINER" 2>&1 | grep -E "(skillup|tutorial-v2|user.skillupitacademy.com|503|502|upstream|error)" || echo "No relevant errors found"
else
    echo -e "${GRAY}Checking Nginx as host service:${NC}"
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}Nginx is running as host service${NC}"
        echo ""
        echo -e "${GRAY}Recent Nginx error log:${NC}"
        tail -n 50 /var/log/nginx/error.log 2>/dev/null | grep -E "(skillup|tutorial-v2|user.skillupitacademy.com|503|502|upstream)" || echo "No relevant errors found"
    else
        echo -e "${YELLOW}Nginx not found as container or host service${NC}"
    fi
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 9: Database Connectivity
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 9: Database Connectivity Test${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Testing database connectivity from container...${NC}"
docker exec "$SKILLUP_CONTAINER" node -e "
const { neon } = require('@neondatabase/serverless');
if (!process.env.DATABASE_URL_TUTORIAL) {
  console.log('ERROR: DATABASE_URL_TUTORIAL not set');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL_TUTORIAL);
sql\`SELECT 1 AS ok\`
  .then(r => {
    console.log('✓ DATABASE_URL_TUTORIAL: Connection successful');
    return sql\`SELECT COUNT(*) as count FROM tutorial_sidebar_trees_v2 WHERE brand_id = 'shared' AND topic_id = '4b21ddc0-123b-41e3-8ea1-280d37f7f035'\`;
  })
  .then(r => {
    console.log('✓ Java sidebar query successful: ' + r[0].count + ' row(s) found');
    process.exit(0);
  })
  .catch(e => {
    console.error('✗ Database error:', e.message);
    process.exit(1);
  });
" 2>&1 || echo "Database test failed"
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 10: Production Image Version
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 10: Production Image Version${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Current production image:${NC}"
docker inspect "$SKILLUP_CONTAINER" --format '{{.Config.Image}}'
echo ""

echo -e "${GRAY}Image details:${NC}"
CURRENT_IMAGE=$(docker inspect "$SKILLUP_CONTAINER" --format '{{.Image}}')
docker image inspect "$CURRENT_IMAGE" --format '
ID: {{.Id}}
Created: {{.Created}}
Size: {{.Size}}
' 2>/dev/null || echo "Could not inspect image"
echo ""

echo -e "${GRAY}Recent releases on server:${NC}"
ls -lth /opt/platform/releases/*.manifest.json 2>/dev/null | head -5 || echo "No manifests found"
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 11: Public URL Test
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 11: Public URL Test${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Testing public URL:${NC}"
echo -e "${GRAY}https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava${NC}"
echo ""

PUBLIC_RESPONSE=$(curl -s -o /tmp/skillup-public-response.html -w "%{http_code}" \
    https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava 2>&1 || echo "FAILED")

echo -e "${GRAY}Public URL response: HTTP $PUBLIC_RESPONSE${NC}"

if [ "$PUBLIC_RESPONSE" = "503" ]; then
    echo -e "${RED}✗ Public URL: HTTP 503 (CONFIRMED)${NC}"
elif [ "$PUBLIC_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Public URL: HTTP 200 (WORKING!)${NC}"
    echo -e "${GREEN}The issue may have been resolved${NC}"
else
    echo -e "${YELLOW}⚠ Public URL: HTTP $PUBLIC_RESPONSE${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 12: System Resources
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PHASE 12: System Resources${NC}"
echo "───────────────────────────────────────────────────────────────"

echo -e "${GRAY}Memory:${NC}"
free -h
echo ""

echo -e "${GRAY}Disk:${NC}"
df -h | grep -E "(Filesystem|/dev/|opt)"
echo ""

echo -e "${GRAY}Docker Stats:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}INVESTIGATION SUMMARY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Key Findings:${NC}"
echo -e "  Container Status: $(docker inspect "$SKILLUP_CONTAINER" --format '{{.State.Status}}')"
echo -e "  Direct Test: HTTP $DIRECT_RESPONSE"
echo -e "  Public Test: HTTP $PUBLIC_RESPONSE"
echo ""

if [ "$DIRECT_RESPONSE" = "503" ] && [ "$PUBLIC_RESPONSE" = "503" ]; then
    echo -e "${RED}ROOT CAUSE: Application error in skillup-web container${NC}"
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Check container logs above for exact stack trace"
    echo -e "  2. Verify DATABASE_URL_TUTORIAL is set correctly"
    echo -e "  3. Check if production image matches latest code"
    echo -e "  4. Consider redeploying latest image"
elif [ "$DIRECT_RESPONSE" = "200" ] && [ "$PUBLIC_RESPONSE" = "503" ]; then
    echo -e "${RED}ROOT CAUSE: Nginx/Cloudflare routing issue${NC}"
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Check Nginx configuration for user.skillupitacademy.com"
    echo -e "  2. Check Nginx logs for upstream errors"
    echo -e "  3. Verify Cloudflare settings"
    echo -e "  4. Check proxy_pass configuration"
elif [ "$DIRECT_RESPONSE" = "200" ] && [ "$PUBLIC_RESPONSE" = "200" ]; then
    echo -e "${GREEN}ISSUE RESOLVED: Both direct and public requests work!${NC}"
else
    echo -e "${YELLOW}ROOT CAUSE: Unclear - review logs above${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}INVESTIGATION COMPLETE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
