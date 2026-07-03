# GCP Cost Optimization Baseline & Dashboard Generator (PowerShell)
$ErrorActionPreference = "Stop"

$PROJECT_ID = "project-48af6a2d-e8bb-46dd-a58"
$REGION = "asia-southeast1"
$MARKETING_REGION = "asia-south1"
$REGISTRY_SE = "asia-southeast1-docker.pkg.dev"
$REGISTRY_S = "asia-south1-docker.pkg.dev"
$REPOSITORY = "quiz-platform"

Write-Host "📊 Capturing current GCP resource state..." -ForegroundColor Cyan

# Ensure audit-reports directory exists
if (-not (Test-Path "audit-reports")) {
    New-Item -ItemType Directory -Path "audit-reports" | Out-Null
}

$DATE = (Get-Date).ToString("yyyy-MM-dd")
$JSON_OUTPUT = "audit-reports/gcp-cost-baseline-$DATE.json"
$MD_OUTPUT = "audit-reports/gcp-infrastructure-dashboard.md"

# 1. Cloud Build Metrics (last 30 runs)
Write-Host "🔍 Querying Cloud Build stats..." -ForegroundColor Yellow
$Builds = gcloud builds list --project=$PROJECT_ID --limit=30 --format="value(id,status,duration,createTime)" 2>$null

$TOTAL_BUILDS = 0
$SUCCESS_BUILDS = 0
$FAILED_BUILDS = 0
$TOTAL_DURATION_SEC = 0
$AVG_DURATION_SEC = 0

if ($Builds) {
    # If it's a single string instead of array, split it
    $BuildLines = $Builds -split "`n"
    foreach ($line in $BuildLines) {
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            $parts = -split $line
            if ($parts.Length -ge 2) {
                $TOTAL_BUILDS++
                $status = $parts[1]
                if ($status -eq "SUCCESS") {
                    $SUCCESS_BUILDS++
                } else {
                    $FAILED_BUILDS++
                }
                
                if ($parts.Length -ge 3) {
                    $duration = $parts[2]
                    if ($duration -ne "None") {
                        # Remove 's' and convert to int
                        $dur = $duration.Replace("s", "")
                        if ($dur -like "*.*") {
                            $dur = $dur -split "\." | Select-Object -First 1
                        }
                        if ([int]::TryParse($dur, [ref]$val)) {
                            $TOTAL_DURATION_SEC += $val
                        }
                    }
                }
            }
        }
    }
    if ($TOTAL_BUILDS -gt 0) {
        $AVG_DURATION_SEC = [int]($TOTAL_DURATION_SEC / $TOTAL_BUILDS)
    }
}

# 2. Artifact Registry Metrics
Write-Host "🔍 Querying Artifact Registry stats..." -ForegroundColor Yellow
$TOTAL_IMAGES_SE = 0
$TOTAL_IMAGES_S = 0

$ImagesSE = gcloud artifacts docker images list "$REGISTRY_SE/$PROJECT_ID/$REPOSITORY" --project=$PROJECT_ID --format="value(package,tag)" 2>$null
if ($ImagesSE) {
    $TOTAL_IMAGES_SE = ($ImagesSE -split "`n").Count
}

$ImagesS = gcloud artifacts docker images list "$REGISTRY_S/$PROJECT_ID/$REPOSITORY" --project=$PROJECT_ID --format="value(package,tag)" 2>$null
if ($ImagesS) {
    $TOTAL_IMAGES_S = ($ImagesS -split "`n").Count
}

$TOTAL_IMAGES = $TOTAL_IMAGES_SE + $TOTAL_IMAGES_S

# 3. Cloud Run Services
Write-Host "🔍 Querying Cloud Run services..." -ForegroundColor Yellow
$Services = gcloud run services list --project=$PROJECT_ID --format="value(metadata.name)" 2>$null

$CR_SERVICES_COUNT = 0
$CR_TOTAL_REVISIONS = 0
$CR_SUMMARY_MD = ""

if ($Services) {
    $ServiceNames = $Services -split "`n"
    foreach ($name in $ServiceNames) {
        $name = $name.Trim()
        if (-not [string]::IsNullOrWhiteSpace($name)) {
            $CR_SERVICES_COUNT++
            
            # Query active region
            $desc = gcloud run services describe $name --project=$PROJECT_ID --region=$REGION --format="value(spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.concurrency)" 2>$null
            if (-not $desc) {
                $desc = gcloud run services describe $name --project=$PROJECT_ID --region=$MARKETING_REGION --format="value(spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.concurrency)" 2>$null
            }
            
            $mem = "Unknown"
            $cpu = "Unknown"
            $conc = "Unknown"
            
            if ($desc) {
                $parts = -split $desc
                if ($parts.Length -ge 1) { $mem = $parts[0] }
                if ($parts.Length -ge 2) { $cpu = $parts[1] }
                if ($parts.Length -ge 3) { $conc = $parts[2] }
            }
            
            # Count revisions in both regions
            $revs = gcloud run revisions list --project=$PROJECT_ID --service=$name --region=$REGION --format="value(metadata.name)" 2>$null
            if (-not $revs) {
                $revs = gcloud run revisions list --project=$PROJECT_ID --service=$name --region=$MARKETING_REGION --format="value(metadata.name)" 2>$null
            }
            
            $rev_count = 0
            if ($revs) {
                $rev_count = ($revs -split "`n").Count
            }
            
            $CR_TOTAL_REVISIONS += $rev_count
            $CR_SUMMARY_MD += "| `$name` | $cpu CPU | $mem | $conc | $rev_count |`n"
        }
    }
}

# 4. Secret Manager Metrics
Write-Host "🔍 Querying Secret Manager..." -ForegroundColor Yellow
$Secrets = gcloud secrets list --project=$PROJECT_ID --format="value(name)" 2>$null

$TOTAL_SECRETS = 0
$TOTAL_SECRET_VERSIONS = 0

if ($Secrets) {
    $SecretNames = $Secrets -split "`n"
    foreach ($name in $SecretNames) {
        $name = $name.Trim()
        if (-not [string]::IsNullOrWhiteSpace($name)) {
            $TOTAL_SECRETS++
            $vers = gcloud secrets versions list $name --project=$PROJECT_ID --format="value(name)" 2>$null
            if ($vers) {
                $TOTAL_SECRET_VERSIONS += ($vers -split "`n").Count
            }
        }
    }
}

# Save JSON output
$json = @{
    date = $DATE
    builds = @{
        total_last_30 = $TOTAL_BUILDS
        success = $SUCCESS_BUILDS
        failed = $FAILED_BUILDS
        avg_duration_sec = $AVG_DURATION_SEC
    }
    registry = @{
        images_se = $TOTAL_IMAGES_SE
        images_s = $TOTAL_IMAGES_S
        total_images = $TOTAL_IMAGES
    }
    cloud_run = @{
        services_count = $CR_SERVICES_COUNT
        total_revisions = $CR_TOTAL_REVISIONS
    }
    secrets = @{
        total_secrets = $TOTAL_SECRETS
        total_versions = $TOTAL_SECRET_VERSIONS
    }
} | ConvertTo-Json

$json | Out-File -FilePath $JSON_OUTPUT -Encoding utf8

# Generate human-readable Markdown Infrastructure Dashboard
$md = @"
# GCP Infrastructure & Cost Dashboard

*Generated on $DATE*

## Cost Summary & Baseline Metrics

This dashboard tracks key resources driving GCP billing, updated via \`scripts/gcp-cost-baseline.ps1\`.

### 📊 Summary Metrics

| Metric | Baseline (Pre-Opt) | Current State | Target Post-Opt | Status |
|--------|:------------------:|:-------------:|:---------------:|:------:|
| **Monthly Estimate** | ~₹6,800 | **₹6,800** | **₹1,500–₹2,500** | 🟡 Active |
| **Artifact Registry Images** | $TOTAL_IMAGES | **$TOTAL_IMAGES** | < 80 | Pending Cleanup |
| **Active Secrets / Versions** | $TOTAL_SECRETS / $TOTAL_SECRET_VERSIONS | **$TOTAL_SECRETS / $TOTAL_SECRET_VERSIONS** | $TOTAL_SECRETS / $TOTAL_SECRETS | Pending Version Cleanup |
| **Cloud Run Revisions** | $CR_TOTAL_REVISIONS | **$CR_TOTAL_REVISIONS** | < 25 | Pending Revision Cleanup |
| **Avg Build Time (Last 30)** | $($AVG_DURATION_SEC)s | **$($AVG_DURATION_SEC)s** | < 120s (with Cache) | Pending Cache |

---

### 🐳 Cloud Run Services Sizing Audit

| Service | CPU | Memory | Concurrency | Total Revisions |
|---------|:---:|:------:|:-----------:|:---------------:|
$CR_SUMMARY_MD
---

### ☁️ Cloud Build Activity (Last 30 Runs)

- **Total Runs Checked**: $TOTAL_BUILDS
- **Success Rate**: $(if ($TOTAL_BUILDS -gt 0) { [int]($SUCCESS_BUILDS * 100 / $TOTAL_BUILDS) } else { 0 })% ($SUCCESS_BUILDS success, $FAILED_BUILDS failed)
- **Average Duration**: $AVG_DURATION_SEC seconds

---

### 📦 Artifact Registry Breakdown

- **asia-southeast1 (Core Repository)**: $TOTAL_IMAGES_SE images
- **asia-south1 (Marketing Repository)**: $TOTAL_IMAGES_S images
- **Total Registered Images / Tags**: $TOTAL_IMAGES

---

### 🔐 Secret Manager

- **Total Unique Secrets**: $TOTAL_SECRETS
- **Total Versions Stored**: $TOTAL_SECRET_VERSIONS (Avg $(if ($TOTAL_SECRETS -gt 0) { [int]($TOTAL_SECRET_VERSIONS / $TOTAL_SECRETS) } else { 0 }) versions per secret)

"@

$md | Out-File -FilePath $MD_OUTPUT -Encoding utf8

Write-Host "✅ Baseline captured successfully!" -ForegroundColor Green
Write-Host "📄 JSON: $JSON_OUTPUT"
Write-Host "📊 Dashboard: $MD_OUTPUT"
