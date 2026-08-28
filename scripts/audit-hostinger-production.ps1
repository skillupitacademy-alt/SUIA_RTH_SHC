#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Read-only Hostinger production configuration audit.

.DESCRIPTION
    Audits the actual production Hostinger server.

    IMPORTANT:
      - READ ONLY
      - No deployment
      - No file modifications
      - No container restarts
      - No secret values printed
#>

[CmdletBinding()]
param(
    [string]$HostAddress = "72.61.115.49",
    [string]$User = "root",
    [string]$ProjectPath = "/opt/platform"
)

$ErrorActionPreference = "Stop"

$Target = "$User@$HostAddress"

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

function Write-Pass {
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

function Invoke-Remote {
    param(
        [Parameter(Mandatory)]
        [string]$Command
    )

    & ssh `
        -o BatchMode=yes `
        -o ConnectTimeout=10 `
        $Target `
        $Command
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "        HOSTINGER PRODUCTION READ-ONLY AUDIT" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Target : $Target"
Write-Host "Project: $ProjectPath"
Write-Host "Mode   : READ ONLY" -ForegroundColor Green
Write-Host ""

# ============================================================
# 1. SSH CONNECTIVITY
# ============================================================

Write-Section "1. SSH CONNECTIVITY"

try {
    $result = & ssh `
        -o BatchMode=yes `
        -o ConnectTimeout=10 `
        $Target `
        "echo HOSTINGER_SSH_OK" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Fail "SSH connection failed."
        Write-Host $result
        exit 1
    }

    Write-Pass "SSH connection successful."
}
catch {
    Write-Fail "SSH connection failed: $($_.Exception.Message)"
    exit 1
}

# ============================================================
# 2. HOST INFORMATION
# ============================================================

Write-Section "2. HOST INFORMATION"

Invoke-Remote @"
echo "Hostname:"
hostname

echo
echo "OS:"
cat /etc/os-release | head -5

echo
echo "Docker:"
docker --version

echo
echo "Docker Compose:"
docker compose version
"@

# ============================================================
# 3. PROJECT DIRECTORY
# ============================================================

Write-Section "3. PRODUCTION PROJECT"

Invoke-Remote @"
if [ -d "$ProjectPath" ]; then
    echo "PROJECT_EXISTS=true"
else
    echo "PROJECT_EXISTS=false"
fi

echo
echo "Project contents:"
ls -lah "$ProjectPath" 2>/dev/null | head -80
"@

# ============================================================
# 4. ENVIRONMENT FILE DISCOVERY
# ============================================================

Write-Section "4. PRODUCTION ENVIRONMENT FILES"

Invoke-Remote @"
echo "Environment files found under $ProjectPath:"
find "$ProjectPath" \
    -maxdepth 5 \
    -type f \
    \( -name ".env" -o -name ".env.*" \) \
    -print 2>/dev/null | sort
"@

# ============================================================
# 5. ENVIRONMENT VARIABLE PRESENCE
# ============================================================

Write-Section "5. REQUIRED ENVIRONMENT VARIABLES"

Invoke-Remote @'
set +e

FILES=$(find /opt/platform \
    -maxdepth 5 \
    -type f \
    \( -name ".env" -o -name ".env.*" \) \
    -print 2>/dev/null)

if [ -z "$FILES" ]; then
    echo "No .env files found."
    exit 0
fi

for FILE in $FILES
do
    echo
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

        LINE=$(grep -E "^${VAR}=" "$FILE" 2>/dev/null | head -1)

        if [ -z "$LINE" ]; then
            echo "$VAR = NOT FOUND"
            continue
        fi

        VALUE="${LINE#*=}"

        if [ -z "$VALUE" ]; then
            echo "$VAR = PRESENT BUT EMPTY"
            continue
        fi

        case "$VAR" in
            INTERNAL_API_SECRET|INTERNAL_GATEWAY_SECRET|JWT_SECRET|ADMIN_JWT_SECRET)
                echo "$VAR = PRESENT (VALUE HIDDEN)"
                ;;
            *)
                echo "$VAR = $VALUE"
                ;;
        esac

    done
done
'@

# ============================================================
# 6. PRODUCTION LOCALHOST CHECK
# ============================================================

Write-Section "6. LOCALHOST API CONFIGURATION CHECK"

Invoke-Remote @'
echo "Searching production configuration..."

echo
echo "--- INTERNAL_API_URL occurrences ---"

grep -RniE \
    "^[[:space:]]*INTERNAL_API_URL=" \
    /opt/platform \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    2>/dev/null |
    sed -E 's#(INTERNAL_API_SECRET=).*#\1<REDACTED>#g'

echo
echo "--- localhost:3000 references ---"

grep -RniE \
    "localhost:3000|127\.0\.0\.1:3000" \
    /opt/platform \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    2>/dev/null |
    head -100

echo
echo "--- production API references ---"

grep -RniE \
    "api\.skillhubcore\.in" \
    /opt/platform \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    2>/dev/null |
    head -100
'@

# ============================================================
# 7. DOCKER COMPOSE FILES
# ============================================================

Write-Section "7. DOCKER COMPOSE CONFIGURATION"

Invoke-Remote @"
echo "Compose files:"

find "$ProjectPath/compose" \
    -maxdepth 3 \
    -type f \
    \( -name "*.yml" -o -name "*.yaml" \) \
    -print 2>/dev/null | sort

echo
echo "Resolved production Compose configuration:"
docker compose \
    -f "$ProjectPath/compose/docker-compose.yml" \
    -f "$ProjectPath/compose/docker-compose.production.yml" \
    config 2>/dev/null |
    sed -E \
        -e 's/(INTERNAL_API_SECRET:).*/\1 <REDACTED>/g' \
        -e 's/(INTERNAL_GATEWAY_SECRET:).*/\1 <REDACTED>/g' \
        -e 's/(JWT_SECRET:).*/\1 <REDACTED>/g' \
        -e 's/(ADMIN_JWT_SECRET:).*/\1 <REDACTED>/g'
"@

# ============================================================
# 8. RUNNING CONTAINERS
# ============================================================

Write-Section "8. RUNNING PRODUCTION CONTAINERS"

Invoke-Remote @'
docker ps \
    --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
'@

# ============================================================
# 9. BFF CONTAINER ENVIRONMENT
# ============================================================

Write-Section "9. ACTUAL RUNNING BFF ENVIRONMENT"

Invoke-Remote @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web")

if [ -z "$CONTAINERS" ]; then
    echo "No RTH/SkillUp BFF containers currently running."
    exit 0
fi

for CONTAINER in $CONTAINERS
do

    echo
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    for VAR in \
        INTERNAL_API_URL \
        INTERNAL_API_SECRET \
        INTERNAL_GATEWAY_SECRET \
        JWT_SECRET \
        ADMIN_JWT_SECRET \
        NEXT_PUBLIC_BRAND
    do

        VALUE=$(docker exec "$CONTAINER" sh -c "printenv $VAR" 2>/dev/null)

        if [ -z "$VALUE" ]; then
            echo "$VAR = NOT SET"
        else
            case "$VAR" in
                INTERNAL_API_SECRET|INTERNAL_GATEWAY_SECRET|JWT_SECRET|ADMIN_JWT_SECRET)
                    echo "$VAR = PRESENT (VALUE HIDDEN)"
                    ;;
                *)
                    echo "$VAR = $VALUE"
                    ;;
            esac
        fi

    done

done
'@

# ============================================================
# 10. DOCKER INSPECT ENVIRONMENT
# ============================================================

Write-Section "10. DOCKER CONTAINER ENVIRONMENT"

Invoke-Remote @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web")

for CONTAINER in $CONTAINERS
do

    echo
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    docker inspect "$CONTAINER" \
        --format '{{range .Config.Env}}{{println .}}{{end}}' |
        sed -E \
            -e 's/(INTERNAL_API_SECRET=).*/\1<REDACTED>/g' \
            -e 's/(INTERNAL_GATEWAY_SECRET=).*/\1<REDACTED>/g' \
            -e 's/(JWT_SECRET=).*/\1<REDACTED>/g' \
            -e 's/(ADMIN_JWT_SECRET=).*/\1<REDACTED>/g'

done
'@

# ============================================================
# 11. BFF → API CONNECTIVITY
# ============================================================

Write-Section "11. BFF → API CONNECTIVITY"

Invoke-Remote @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web")

for CONTAINER in $CONTAINERS
do

    echo
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    API_URL=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_API_URL' 2>/dev/null)

    if [ -z "$API_URL" ]; then
        echo "[FAIL] INTERNAL_API_URL is not set."
        continue
    fi

    echo "Configured API URL: $API_URL"

    if echo "$API_URL" | grep -Eq "localhost:3000|127\.0\.0\.1:3000"; then
        echo "[FAIL] Production BFF points to localhost API."
        continue
    fi

    if docker exec "$CONTAINER" sh -c "command -v curl >/dev/null 2>&1"; then

        echo "Testing API endpoint..."

        docker exec "$CONTAINER" sh -c \
            "curl -k -sS -o /dev/null -w 'HTTP_STATUS=%{http_code}\n' --max-time 10 '$API_URL'"

    else
        echo "[WARN] curl is not installed in container."
    fi

done
'@

# ============================================================
# 12. RECENT BFF LOGS
# ============================================================

Write-Section "12. RECENT BFF AUTH/API LOGS"

Invoke-Remote @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web")

for CONTAINER in $CONTAINERS
do

    echo
    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    docker logs --since 2h "$CONTAINER" 2>&1 |
        grep -Ei \
        "INTERNAL_API|API_REQUEST|Profile GET|AUTH_FLOW|BFF_AUTH|BFF_GATEWAY|403|500|Internal Server Error" |
        tail -80

done
'@

# ============================================================
# 13. IMAGE VERSIONS
# ============================================================

Write-Section "13. DEPLOYED IMAGE VERSIONS"

Invoke-Remote @'
docker ps \
    --format "{{.Names}}|{{.Image}}" |
    grep -E \
    "realtutorialhub-web|skillup-web|api-server|skillhubcore-admin|skillup-admin|realtutorialhub-admin" |
    sort
'@

# ============================================================
# 14. RELEASE INFORMATION
# ============================================================

Write-Section "14. DEPLOYMENT RELEASE INFORMATION"

Invoke-Remote @'
echo "Release directory:"
ls -lah /opt/platform/releases 2>/dev/null | tail -40

echo
echo "Deployment scripts:"
ls -lah /opt/platform/scripts 2>/dev/null
'@

# ============================================================
# 15. AUTOMATED ASSESSMENT
# ============================================================

Write-Section "15. AUTOMATED PRODUCTION ASSESSMENT"

Invoke-Remote @'
set +e

FAIL=0
WARN=0

CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "realtutorialhub-web|skillup-web")

if [ -z "$CONTAINERS" ]; then
    echo "[FAIL] No RTH/SkillUp BFF containers are running."
    FAIL=$((FAIL + 1))
fi

for CONTAINER in $CONTAINERS
do

    echo
    echo "Checking container: $CONTAINER"

    API_URL=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_API_URL' 2>/dev/null)
    API_SECRET=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_API_SECRET' 2>/dev/null)
    GATEWAY_SECRET=$(docker exec "$CONTAINER" sh -c 'printenv INTERNAL_GATEWAY_SECRET' 2>/dev/null)

    if [ -z "$API_URL" ]; then

        echo "[FAIL] INTERNAL_API_URL missing."
        FAIL=$((FAIL + 1))

    else

        echo "[PASS] INTERNAL_API_URL present: $API_URL"

        if echo "$API_URL" | grep -Eq "localhost:3000|127\.0\.0\.1:3000"; then
            echo "[FAIL] Production BFF points to localhost API."
            FAIL=$((FAIL + 1))
        else
            echo "[PASS] API URL is not localhost:3000."
        fi

    fi

    if [ -z "$API_SECRET" ]; then
        echo "[FAIL] INTERNAL_API_SECRET missing."
        FAIL=$((FAIL + 1))
    else
        echo "[PASS] INTERNAL_API_SECRET present."
    fi

    if [ -z "$GATEWAY_SECRET" ]; then
        echo "[WARN] INTERNAL_GATEWAY_SECRET missing."
        WARN=$((WARN + 1))
    else
        echo "[PASS] INTERNAL_GATEWAY_SECRET present."
    fi

done

echo
echo "------------------------------------------------------------"
echo "ASSESSMENT RESULT"
echo "------------------------------------------------------------"

echo "Failures : $FAIL"
echo "Warnings : $WARN"

if [ "$FAIL" -gt 0 ]; then
    echo "RESULT   : FAIL"
    exit 2
fi

if [ "$WARN" -gt 0 ]; then
    echo "RESULT   : PASS WITH WARNINGS"
    exit 0
fi

echo "RESULT   : PASS"
exit 0
'@

# ============================================================
# FINAL
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "           HOSTINGER AUDIT COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "READ-ONLY AUDIT — NO PRODUCTION CHANGES WERE MADE." -ForegroundColor Green
Write-Host ""
Write-Host "Secrets were never printed." -ForegroundColor Gray
Write-Host "Containers were not restarted." -ForegroundColor Gray
Write-Host "No deployment was performed." -ForegroundColor Gray
Write-Host ""
