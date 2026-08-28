#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Read-only production environment and deployment audit.

.DESCRIPTION
    Audits the actual Hostinger production configuration and running
    containers without changing anything.

    IMPORTANT:
    - Does NOT modify files.
    - Does NOT restart containers.
    - Does NOT deploy anything.
    - Does NOT print secret values.
    - Only reports whether required secrets exist and what URLs/configuration
      are actually being used.

.NOTES
    Target:
        root@72.61.115.49

    Production project:
        /opt/platform
#>

[CmdletBinding()]
param(
    [string]$HostAddress = "72.61.115.49",
    [string]$User = "root"
)

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Title)

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host "============================================================" -ForegroundColor Blue
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

$Target = "$User@$HostAddress"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "       HOSTINGER PRODUCTION READ-ONLY AUDIT" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Target: $Target" -ForegroundColor Gray
Write-Host "Mode:   READ ONLY" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# 1. Connectivity
# ------------------------------------------------------------

Write-Section "1. SSH CONNECTIVITY"

ssh -o BatchMode=yes -o ConnectTimeout=10 $Target "echo HOSTINGER_SSH_OK"

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Cannot connect to Hostinger."
    exit 1
}

Write-Success "SSH connection successful."

# ------------------------------------------------------------
# 2. Host information
# ------------------------------------------------------------

Write-Section "2. HOST INFORMATION"

ssh $Target @"
echo "Hostname:"
hostname

echo ""
echo "OS:"
cat /etc/os-release | head -5

echo ""
echo "Docker:"
docker --version

echo ""
echo "Docker Compose:"
docker compose version
"@

# ------------------------------------------------------------
# 3. Production directories
# ------------------------------------------------------------

Write-Section "3. PRODUCTION DIRECTORY STRUCTURE"

ssh $Target @"
echo "Checking /opt/platform..."
if [ -d /opt/platform ]; then
    echo "OK: /opt/platform exists"
else
    echo "ERROR: /opt/platform does not exist"
    exit 1
fi

echo ""
echo "Top-level:"
find /opt/platform -maxdepth 2 -type d | sort | head -80
"@

# ------------------------------------------------------------
# 4. Environment files
# ------------------------------------------------------------

Write-Section "4. PRODUCTION ENVIRONMENT FILES"

ssh $Target @"
echo "Environment-related files:"
find /opt/platform \
    -maxdepth 4 \
    -type f \
    \( -name ".env" -o -name ".env.*" -o -name "*env*" \) \
    -print 2>/dev/null | sort
"@

# ------------------------------------------------------------
# 5. Required variables in likely environment files
# ------------------------------------------------------------

Write-Section "5. REQUIRED ENVIRONMENT VARIABLES"

ssh $Target @'
set +e

echo ""
echo "Scanning environment files for required variables."
echo "SECRET VALUES WILL NOT BE DISPLAYED."
echo ""

FILES=$(find /opt/platform \
    -maxdepth 5 \
    -type f \
    \( -name ".env" -o -name ".env.*" \) \
    -print 2>/dev/null)

if [ -z "$FILES" ]; then
    echo "No .env files found under /opt/platform"
else
    for FILE in $FILES; do
        echo "------------------------------------------------------------"
        echo "FILE: $FILE"
        echo "------------------------------------------------------------"

        for VAR in \
            INTERNAL_API_URL \
            INTERNAL_API_SECRET \
            INTERNAL_GATEWAY_SECRET \
            JWT_SECRET \
            ADMIN_JWT_SECRET \
            DATABASE_URL \
            DATABASE_URL_TUTORIAL
        do
            if grep -qE "^${VAR}=" "$FILE" 2>/dev/null; then

                VALUE=$(grep -E "^${VAR}=" "$FILE" | head -1 | cut -d= -f2-)

                if [ -z "$VALUE" ]; then
                    echo "$VAR = PRESENT BUT EMPTY"
                else
                    echo "$VAR = PRESENT (value hidden)"
                fi

            else
                echo "$VAR = NOT FOUND"
            fi
        done
    done
fi
'@

# ------------------------------------------------------------
# 6. Detect localhost API URLs
# ------------------------------------------------------------

Write-Section "6. PRODUCTION LOCALHOST API CHECK"

ssh $Target @'
echo "Searching production configuration for localhost API references..."
echo ""

MATCHES=$(grep -RniE \
    "INTERNAL_API_URL|localhost:3000|127\.0\.0\.1:3000|api\.skillhubcore\.in" \
    /opt/platform/compose \
    /opt/platform/.env \
    /opt/platform/.env.* \
    2>/dev/null)

if [ -z "$MATCHES" ]; then
    echo "No matching configuration found."
else
    echo "$MATCHES" | \
        sed -E \
        -e "s/(INTERNAL_API_SECRET=).*/\1<REDACTED>/g" \
        -e "s/(INTERNAL_GATEWAY_SECRET=).*/\1<REDACTED>/g" \
        -e "s/(JWT_SECRET=).*/\1<REDACTED>/g" \
        -e "s/(ADMIN_JWT_SECRET=).*/\1<REDACTED>/g"
fi
'@

# ------------------------------------------------------------
# 7. Docker Compose configuration
# ------------------------------------------------------------

Write-Section "7. DOCKER COMPOSE CONFIGURATION"

ssh $Target @"
echo "Compose files:"
find /opt/platform/compose \
    -maxdepth 2 \
    -type f \
    \( -name "*.yml" -o -name "*.yaml" \) \
    -print 2>/dev/null | sort

echo ""
echo "Production Compose configuration:"
docker compose \
    -f /opt/platform/compose/docker-compose.yml \
    -f /opt/platform/compose/docker-compose.production.yml \
    config 2>/dev/null | \
    sed -E \
    -e 's/(INTERNAL_API_SECRET:).*/\1 <REDACTED>/g' \
    -e 's/(INTERNAL_GATEWAY_SECRET:).*/\1 <REDACTED>/g' \
    -e 's/(JWT_SECRET:).*/\1 <REDACTED>/g' \
    -e 's/(ADMIN_JWT_SECRET:).*/\1 <REDACTED>/g'
"@

# ------------------------------------------------------------
# 8. Running containers
# ------------------------------------------------------------

Write-Section "8. RUNNING PRODUCTION CONTAINERS"

ssh $Target @"
docker ps \
    --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
"@

# ------------------------------------------------------------
# 9. Expected services
# ------------------------------------------------------------

Write-Section "9. EXPECTED APPLICATION SERVICES"

ssh $Target @'
EXPECTED="
api-server
realtutorialhub-web
skillup-web
skillhubcore-admin
skillup-admin
realtutorialhub-admin
faculty-app
skillhub-placement
question-judge
"

for SERVICE in $EXPECTED; do

    COUNT=$(docker ps \
        --filter "name=$SERVICE" \
        --format "{{.Names}}" | wc -l)

    if [ "$COUNT" -gt 0 ]; then
        echo "[RUNNING] $SERVICE"
    else
        echo "[NOT RUNNING] $SERVICE"
    fi

done
'@

# ------------------------------------------------------------
# 10. Actual environment inside running BFF containers
# ------------------------------------------------------------

Write-Section "10. ACTUAL RUNNING BFF ENVIRONMENT"

ssh $Target @'
set +e

for CONTAINER in $(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web"); do

    echo ""
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    echo ""
    echo "Environment presence:"
    
    docker exec "$CONTAINER" sh -c '
        for VAR in \
            INTERNAL_API_URL \
            INTERNAL_API_SECRET \
            INTERNAL_GATEWAY_SECRET \
            JWT_SECRET \
            ADMIN_JWT_SECRET \
            NEXT_PUBLIC_BRAND
        do
            VALUE=$(printenv "$VAR" 2>/dev/null)

            if [ -z "$VALUE" ]; then
                echo "$VAR = NOT SET"
            else
                case "$VAR" in
                    INTERNAL_API_SECRET|INTERNAL_GATEWAY_SECRET|JWT_SECRET|ADMIN_JWT_SECRET)
                        echo "$VAR = PRESENT (value hidden)"
                        ;;
                    *)
                        echo "$VAR = $VALUE"
                        ;;
                esac
            fi
        done
    '

done
'@

# ------------------------------------------------------------
# 11. Actual Docker container configuration
# ------------------------------------------------------------

Write-Section "11. DOCKER INSPECT — ENVIRONMENT SOURCE"

ssh $Target @'
set +e

for CONTAINER in $(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web"); do

    echo ""
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    docker inspect "$CONTAINER" \
        --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null |
        sed -E \
        -e 's/(INTERNAL_API_SECRET=).*/\1<REDACTED>/g' \
        -e 's/(INTERNAL_GATEWAY_SECRET=).*/\1<REDACTED>/g' \
        -e 's/(JWT_SECRET=).*/\1<REDACTED>/g' \
        -e 's/(ADMIN_JWT_SECRET=).*/\1<REDACTED>/g'

done
'@

# ------------------------------------------------------------
# 12. API connectivity from BFF containers
# ------------------------------------------------------------

Write-Section "12. BFF → API CONNECTIVITY"

ssh $Target @'
set +e

for CONTAINER in $(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web"); do

    echo ""
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    API_URL=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_API_URL' 2>/dev/null)

    if [ -z "$API_URL" ]; then
        echo "[FAIL] INTERNAL_API_URL not set"
        continue
    fi

    echo "Configured API URL: $API_URL"

    echo ""
    echo "Testing API base connectivity..."

    docker exec "$CONTAINER" sh -c "
        if command -v curl >/dev/null 2>&1; then
            curl -k -sS -o /dev/null -w 'HTTP_STATUS=%{http_code}\n' \
                --max-time 10 \
                '$API_URL'
        else
            echo 'curl not installed in container'
        fi
    "

done
'@

# ------------------------------------------------------------
# 13. Container logs — configuration/auth errors only
# ------------------------------------------------------------

Write-Section "13. RECENT BFF AUTH/API CONFIGURATION LOGS"

ssh $Target @'
set +e

for CONTAINER in $(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web"); do

    echo ""
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    docker logs --since 2h "$CONTAINER" 2>&1 |
        grep -Ei \
        "INTERNAL_API|API_REQUEST|Profile GET|AUTH_FLOW|BFF_AUTH|BFF_GATEWAY|403|500|Internal Server Error" |
        tail -80

done
'@

# ------------------------------------------------------------
# 14. Image versions
# ------------------------------------------------------------

Write-Section "14. DEPLOYED IMAGE VERSIONS"

ssh $Target @'
docker ps \
    --format "{{.Names}}|{{.Image}}" |
    grep -E "realtutorialhub-web|skillup-web|api-server|skillhubcore-admin|skillup-admin|realtutorialhub-admin" |
    sort
'@

# ------------------------------------------------------------
# 15. Deployment release information
# ------------------------------------------------------------

Write-Section "15. DEPLOYMENT RELEASES"

ssh $Target @'
echo "Recent release artifacts:"
ls -lah /opt/platform/releases 2>/dev/null | tail -30

echo ""
echo "Deployment scripts:"
ls -lah /opt/platform/scripts 2>/dev/null
'@

# ------------------------------------------------------------
# 16. Final automated assessment
# ------------------------------------------------------------

Write-Section "16. AUTOMATED PRODUCTION CONFIGURATION ASSESSMENT"

ssh $Target @'
set +e

FAIL=0
WARN=0

echo ""

# Check BFF containers
for CONTAINER in $(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web"); do

    echo "Checking: $CONTAINER"

    API_URL=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_API_URL' 2>/dev/null)
    API_SECRET=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_API_SECRET' 2>/dev/null)
    GATEWAY_SECRET=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_GATEWAY_SECRET' 2>/dev/null)

    if [ -z "$API_URL" ]; then
        echo "  [FAIL] INTERNAL_API_URL missing"
        FAIL=$((FAIL + 1))
    else
        echo "  [PASS] INTERNAL_API_URL present: $API_URL"

        case "$API_URL" in
            *localhost:3000*|*127.0.0.1:3000*)
                echo "  [FAIL] Production BFF points to localhost API"
                FAIL=$((FAIL + 1))
                ;;
            *)
                echo "  [PASS] API URL is not localhost:3000"
                ;;
        esac
    fi

    if [ -z "$API_SECRET" ]; then
        echo "  [FAIL] INTERNAL_API_SECRET missing"
        FAIL=$((FAIL + 1))
    else
        echo "  [PASS] INTERNAL_API_SECRET present"
    fi

    if [ -z "$GATEWAY_SECRET" ]; then
        echo "  [WARN] INTERNAL_GATEWAY_SECRET missing"
        WARN=$((WARN + 1))
    else
        echo "  [PASS] INTERNAL_GATEWAY_SECRET present"
    fi

done

echo ""
echo "------------------------------------------------------------"
echo "ASSESSMENT"
echo "------------------------------------------------------------"

echo "Failures: $FAIL"
echo "Warnings: $WARN"

if [ "$FAIL" -gt 0 ]; then
    echo ""
    echo "RESULT: FAIL"
    echo "Production configuration requires attention."
    exit 2
fi

if [ "$WARN" -gt 0 ]; then
    echo ""
    echo "RESULT: PASS WITH WARNINGS"
    exit 0
fi

echo ""
echo "RESULT: PASS"
exit 0
'@

# ------------------------------------------------------------
# Completion
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "       HOSTINGER AUDIT COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "This audit made NO changes to Hostinger." -ForegroundColor Gray
Write-Host "No containers were restarted." -ForegroundColor Gray
Write-Host "No deployment was performed." -ForegroundColor Gray
Write-Host "Secret values were intentionally hidden." -ForegroundColor Gray
Write-Host ""
