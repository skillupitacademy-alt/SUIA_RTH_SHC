# ============================================================
# HOSTINGER PRODUCTION READ-ONLY AUDIT
# ============================================================
#
# Purpose:
#   Audit the actual Hostinger production environment BEFORE
#   making any deployment/configuration changes.
#
# IMPORTANT:
#   This script is READ ONLY.
#   It does NOT:
#     - deploy
#     - restart containers
#     - edit files
#     - modify environment variables
#     - run docker compose up/down
#     - run migrations
#     - alter databases
#
# ============================================================

[CmdletBinding()]
param(
    [string]$HostAddress = "72.61.115.49",
    [string]$User = "root",
    [string]$ProjectPath = "/opt/platform"
)

$ErrorActionPreference = "Stop"

$Target = "$User@$HostAddress"

# ============================================================
# HELPERS
# ============================================================

function Write-Section {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Info {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Pass {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Warn {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[FAIL] $Message" -ForegroundColor Red
}


function Invoke-Remote {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo

    $psi.FileName = "ssh.exe"
    $psi.Arguments = "$Target `"bash -s`""

    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi

    try {
        [void]$process.Start()

        $process.StandardInput.Write($Command)
        $process.StandardInput.Close()

        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()

        $process.WaitForExit()

        if ($stdout.Length -gt 0) {
            $stdout -split "`r?`n" |
                ForEach-Object {
                    if ($_ -ne "") {
                        Write-Host $_
                    }
                }
        }

        if ($stderr.Length -gt 0) {
            $stderr -split "`r?`n" |
                ForEach-Object {
                    if ($_ -ne "") {
                        Write-Host $_ -ForegroundColor Yellow
                    }
                }
        }

        if ($process.ExitCode -ne 0) {
            Write-Warn "Remote command returned exit code $($process.ExitCode)"
        }

        return $stdout
    }
    finally {
        if ($process) {
            $process.Dispose()
        }
    }
}

# ============================================================
# HEADER
# ============================================================

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
    $sshTest = & ssh $Target "echo HOSTINGER_SSH_OK" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Fail "SSH connection failed."
        Write-Host $sshTest
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

$hostInfoCommand = @'
echo "Hostname:"
hostname

echo
echo "OS:"
uname -a

echo
echo "Docker:"
docker --version 2>/dev/null || echo "Docker not available"

echo
echo "Docker Compose:"
docker compose version 2>/dev/null || echo "Docker Compose not available"

echo
echo "Disk:"
df -h /

echo
echo "Memory:"
free -h 2>/dev/null || true
'@

Invoke-Remote $hostInfoCommand

# ============================================================
# 3. PRODUCTION PROJECT
# ============================================================

Write-Section "3. PRODUCTION PROJECT"

$projectCommand = @'
if [ -d 'PROJECT_PATH' ]; then
    echo 'PROJECT_EXISTS=true'
    echo
    echo 'Project contents:'
    ls -lah 'PROJECT_PATH' 2>/dev/null
else
    echo 'PROJECT_EXISTS=false'
fi
'@

$projectCommand = $projectCommand.Replace(
    "PROJECT_PATH",
    $ProjectPath
)

Invoke-Remote $projectCommand

# ============================================================
# 4. ENVIRONMENT FILE DISCOVERY
# ============================================================

Write-Section "4. PRODUCTION ENVIRONMENT FILES"

$envDiscoveryCommand = @'
echo 'Environment files found under PROJECT_PATH:'

find 'PROJECT_PATH' \
    -maxdepth 5 \
    -type f \
    \( -name '.env' -o -name '.env.*' \) \
    -print 2>/dev/null |
    sort
'@

$envDiscoveryCommand = $envDiscoveryCommand.Replace("PROJECT_PATH", $ProjectPath)

Invoke-Remote $envDiscoveryCommand

# ============================================================
# 5. REQUIRED ENVIRONMENT VARIABLE PRESENCE
# ============================================================

Write-Section "5. REQUIRED ENVIRONMENT VARIABLE PRESENCE"

$envPresenceCommand = @'
set +e

echo "Searching environment files..."
echo

find 'PROJECT_PATH' \
    -maxdepth 5 \
    -type f \
    \( -name '.env' -o -name '.env.*' \) \
    -print 2>/dev/null |
while IFS= read -r FILE; do

    [ -z "$FILE" ] && continue

    echo "------------------------------------------------------------"
    echo "FILE: $FILE"
    echo "------------------------------------------------------------"

    REQUIRED_VARS="
GATEWAY_URL
DATABASE_URL
DATABASE_URL_TUTORIAL
JWT_SECRET
ADMIN_JWT_SECRET
NEXT_PUBLIC_BRAND
INTERNAL_GATEWAY_SECRET
INTERNAL_API_SECRET
INTERNAL_API_URL
"

    for VAR in $REQUIRED_VARS; do

        LINE=$(grep -E "^[[:space:]]*${VAR}=" "$FILE" 2>/dev/null | sed -n '1p')

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
            JWT_SECRET|ADMIN_JWT_SECRET|INTERNAL_GATEWAY_SECRET|INTERNAL_API_SECRET|DATABASE_URL|DATABASE_URL_TUTORIAL)
                echo "$VAR = PRESENT (VALUE HIDDEN)"
                ;;
            *)
                echo "$VAR = $VALUE"
                ;;
        esac

    done

    echo

done
'@

$envPresenceCommand = $envPresenceCommand.Replace(
    "PROJECT_PATH",
    $ProjectPath
)

Invoke-Remote $envPresenceCommand

# ============================================================
# 6. API URL CONFIGURATION
# ============================================================

Write-Section "6. API URL CONFIGURATION"

$apiConfigCommand = @'
set +e

echo "--- INTERNAL_API_URL occurrences ---"

grep -RInE \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    "^[[:space:]]*INTERNAL_API_URL=" \
    'PROJECT_PATH' 2>/dev/null |
    sed -n '1,100p'

echo
echo "--- localhost:3000 references ---"

grep -RInE \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    "localhost:3000|127\.0\.0\.1:3000" \
    'PROJECT_PATH' 2>/dev/null |
    sed -n '1,100p'

echo
echo "--- production API references ---"

grep -RInE \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    "api\.skillhubcore\.in" \
    'PROJECT_PATH' 2>/dev/null |
    sed -n '1,100p'
'@

$apiConfigCommand = $apiConfigCommand.Replace("PROJECT_PATH", $ProjectPath)

Invoke-Remote $apiConfigCommand

# ============================================================
# 7. DOCKER COMPOSE CONFIGURATION
# ============================================================

Write-Section "7. DOCKER COMPOSE CONFIGURATION"

$composeCommand = @'
set +e

echo "Compose files:"

find 'PROJECT_PATH' \
    -maxdepth 4 \
    -type f \
    \( -name 'docker-compose.yml' \
       -o -name 'docker-compose.yaml' \
       -o -name 'compose.yml' \
       -o -name 'compose.yaml' \) \
    -print 2>/dev/null |
    sort

echo
echo "Docker Compose services if available:"

cd 'PROJECT_PATH' 2>/dev/null || exit 0

docker compose config --services 2>/dev/null || \
    echo "Unable to read compose services from project root."
'@

$composeCommand = $composeCommand.Replace("PROJECT_PATH", $ProjectPath)

Invoke-Remote $composeCommand

# ============================================================
# 8. RUNNING PRODUCTION CONTAINERS
# ============================================================

Write-Section "8. RUNNING PRODUCTION CONTAINERS"

$containersCommand = @'
echo "Running containers:"
echo

docker ps \
    --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
'@

Invoke-Remote $containersCommand

# ============================================================
# 9. ACTUAL RUNNING BFF ENVIRONMENT
# ============================================================

Write-Section "9. ACTUAL RUNNING BFF ENVIRONMENT"

$bffEnvironmentCommand = @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" |
    grep -E "realtutorialhub-web|skillup-web")

if [ -z "$CONTAINERS" ]; then
    echo "No RTH/SkillUp BFF containers currently running."
    exit 0
fi

REQUIRED_VARS="
GATEWAY_URL
INTERNAL_GATEWAY_SECRET
INTERNAL_API_SECRET
INTERNAL_API_URL
NEXT_PUBLIC_BRAND
"

for CONTAINER in $CONTAINERS; do

    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    for VAR in $REQUIRED_VARS; do

        VALUE=$(docker exec "$CONTAINER" \
            sh -c "printenv $VAR" 2>/dev/null)

        if [ -z "$VALUE" ]; then
            echo "$VAR = NOT SET"
            continue
        fi

        case "$VAR" in
            INTERNAL_GATEWAY_SECRET|INTERNAL_API_SECRET)
                echo "$VAR = PRESENT (VALUE HIDDEN)"
                ;;
            *)
                echo "$VAR = $VALUE"
                ;;
        esac

    done

    echo
done
'@

Invoke-Remote $bffEnvironmentCommand

# ============================================================
# 10. DOCKER INSPECT ENVIRONMENT
# ============================================================

Write-Section "10. DOCKER CONTAINER ENVIRONMENT"

$dockerInspectCommand = @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" |
    grep -E "realtutorialhub-web|skillup-web")

if [ -z "$CONTAINERS" ]; then
    echo "No RTH/SkillUp containers found."
    exit 0
fi

for CONTAINER in $CONTAINERS; do

    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    docker inspect "$CONTAINER" \
        --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null |
        sed -E \
            's/^(JWT_SECRET|ADMIN_JWT_SECRET|DATABASE_URL|DATABASE_URL_TUTORIAL|INTERNAL_GATEWAY_SECRET|INTERNAL_API_SECRET)=.*/\1=PRESENT (VALUE HIDDEN)/' |
        sort

    echo
done
'@

Invoke-Remote $dockerInspectCommand

# ============================================================
# 11. BFF -> API CONNECTIVITY
# ============================================================

Write-Section "11. BFF -> API CONNECTIVITY"

$bffApiCommand = @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" |
    grep -E "realtutorialhub-web|skillup-web")

if [ -z "$CONTAINERS" ]; then
    echo "No RTH/SkillUp BFF containers are running."
    exit 0
fi

for CONTAINER in $CONTAINERS; do

    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    API_URL=$(docker exec "$CONTAINER" \
        sh -c 'printenv INTERNAL_API_URL' 2>/dev/null)

    if [ -z "$API_URL" ]; then
        echo "[FAIL] INTERNAL_API_URL is not set."
        continue
    fi

    echo "Configured API URL: $API_URL"

    if echo "$API_URL" |
        grep -Eq "localhost:3000|127\.0\.0\.1:3000"; then

        echo "[FAIL] Production BFF points to localhost API."

    else

        echo "[PASS] API URL is not localhost:3000."

    fi

    echo

    if docker exec "$CONTAINER" \
        sh -c "command -v curl >/dev/null 2>&1"; then

        echo "Testing configured API endpoint..."

        docker exec "$CONTAINER" \
            sh -c \
            "curl -k -sS -o /dev/null -w 'HTTP_STATUS=%{http_code}\n' --max-time 10 '$API_URL'"

    else

        echo "[WARN] curl is not installed in container."

    fi

    echo
done
'@

Invoke-Remote $bffApiCommand

# ============================================================
# 12. RECENT BFF AUTH/API LOGS
# ============================================================

Write-Section "12. RECENT BFF AUTH/API LOGS"

$bffLogsCommand = @'
set +e

CONTAINERS=$(docker ps --format "{{.Names}}" |
    grep -E "realtutorialhub-web|skillup-web")

if [ -z "$CONTAINERS" ]; then
    echo "No RTH/SkillUp BFF containers are running."
    exit 0
fi

for CONTAINER in $CONTAINERS; do

    echo "------------------------------------------------------------"
    echo "CONTAINER: $CONTAINER"
    echo "------------------------------------------------------------"

    docker logs --since 2h "$CONTAINER" 2>&1 |
        grep -E \
        "INTERNAL_API|API_REQUEST|Profile GET|AUTH_FLOW|BFF_AUTH|BFF_GATEWAY|403|500|Internal Server Error" |
        tail -200

    echo
done
'@

Invoke-Remote $bffLogsCommand

# ============================================================
# 13. DEPLOYED IMAGE VERSIONS
# ============================================================

Write-Section "13. DEPLOYED IMAGE VERSIONS"

$imageCommand = @'
docker ps \
    --format "{{.Names}}|{{.Image}}|{{.Status}}" |
    grep -E \
    "realtutorialhub-web|skillup-web|api-server|skillhubcore-admin|skillup-admin|realtutorialhub-admin" |
    sort
'@

Invoke-Remote $imageCommand

# ============================================================
# 14. DEPLOYMENT / RELEASE INFORMATION
# ============================================================

Write-Section "14. DEPLOYMENT / RELEASE INFORMATION"

$releaseCommand = @'
echo "Release directories:"

find 'PROJECT_PATH' \
    -maxdepth 2 \
    -type d \
    \( -name 'releases' -o -name 'release' -o -name 'current' \) \
    -print 2>/dev/null |
    sort

echo
echo "Git information if repository exists:"

cd 'PROJECT_PATH' 2>/dev/null || true

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then

    echo "Branch:"
    git branch --show-current

    echo
    echo "HEAD:"
    git rev-parse HEAD

    echo
    echo "Latest commit:"
    git log -1 --oneline

else

    echo "Production project is not a Git working tree."

fi

echo
echo "Deployment-related scripts:"

find 'PROJECT_PATH' \
    -maxdepth 4 \
    -type f \
    \( -iname '*deploy*' -o -iname '*release*' \) \
    -print 2>/dev/null |
    sort |
    sed -n '1,100p'
'@

$releaseCommand = $releaseCommand.Replace("PROJECT_PATH", $ProjectPath)

Invoke-Remote $releaseCommand

# ============================================================
# 15. AUTOMATED PRODUCTION ASSESSMENT
# ============================================================

Write-Section "15. AUTOMATED PRODUCTION ASSESSMENT"

$assessmentCommand = @'
set +e

FAIL=0
WARN=0

CONTAINERS=$(docker ps --format "{{.Names}}" |
    grep -E "realtutorialhub-web|skillup-web")

if [ -z "$CONTAINERS" ]; then

    echo "[FAIL] No RTH/SkillUp BFF containers are running."
    FAIL=$((FAIL + 1))

else

    for CONTAINER in $CONTAINERS; do

        echo "------------------------------------------------------------"
        echo "Checking container: $CONTAINER"
        echo "------------------------------------------------------------"

        API_URL=$(docker exec "$CONTAINER" \
            sh -c 'printenv INTERNAL_API_URL' 2>/dev/null)

        API_SECRET=$(docker exec "$CONTAINER" \
            sh -c 'printenv INTERNAL_API_SECRET' 2>/dev/null)

        GATEWAY_SECRET=$(docker exec "$CONTAINER" \
            sh -c 'printenv INTERNAL_GATEWAY_SECRET' 2>/dev/null)

        BRAND=$(docker exec "$CONTAINER" \
            sh -c 'printenv NEXT_PUBLIC_BRAND' 2>/dev/null)

        if [ -z "$API_URL" ]; then

            echo "[FAIL] INTERNAL_API_URL missing."
            FAIL=$((FAIL + 1))

        else

            echo "[PASS] INTERNAL_API_URL present: $API_URL"

            if echo "$API_URL" |
                grep -Eq "localhost:3000|127\.0\.0\.1:3000"; then

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

        if [ -z "$BRAND" ]; then

            echo "[WARN] NEXT_PUBLIC_BRAND missing."
            WARN=$((WARN + 1))

        else

            echo "[PASS] NEXT_PUBLIC_BRAND=$BRAND"

        fi

        echo

    done

fi

echo "------------------------------------------------------------"
echo "ASSESSMENT RESULT"
echo "------------------------------------------------------------"

echo "Failures : $FAIL"
echo "Warnings : $WARN"

if [ "$FAIL" -gt 0 ]; then

    echo "RESULT   : FAIL"

elif [ "$WARN" -gt 0 ]; then

    echo "RESULT   : PASS WITH WARNINGS"

else

    echo "RESULT   : PASS"

fi
'@

Invoke-Remote $assessmentCommand

# ============================================================
# COMPLETE
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "           HOSTINGER AUDIT COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "READ-ONLY AUDIT - NO PRODUCTION CHANGES WERE MADE." -ForegroundColor Green
Write-Host ""
Write-Host "Secrets were never printed." -ForegroundColor Gray
Write-Host "Containers were not restarted." -ForegroundColor Gray
Write-Host "No deployment was performed." -ForegroundColor Gray
Write-Host ""
