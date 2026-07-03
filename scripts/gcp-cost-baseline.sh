#!/bin/bash
# GCP Cost Optimization Baseline & Dashboard Generator
set -euo pipefail

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"
MARKETING_REGION="asia-south1"
REGISTRY_SE="asia-southeast1-docker.pkg.dev"
REGISTRY_S="asia-south1-docker.pkg.dev"
REPOSITORY="quiz-platform"

echo "📊 Capturing current GCP resource state..."

# Ensure audit-reports directory exists
mkdir -p audit-reports

DATE=$(date +%Y-%m-%d)
JSON_OUTPUT="audit-reports/gcp-cost-baseline-${DATE}.json"
MD_OUTPUT="audit-reports/gcp-infrastructure-dashboard.md"

# Temporary files
BUILD_STATS_TMP=$(mktemp)
AR_STATS_TMP=$(mktemp)
CR_STATS_TMP=$(mktemp)
SM_STATS_TMP=$(mktemp)

# 1. Cloud Build Metrics (last 30 runs)
echo "🔍 Querying Cloud Build stats..."
gcloud builds list --project="$PROJECT_ID" --limit=30 \
  --format="value(id,status,duration,createTime)" > "$BUILD_STATS_TMP" || echo "No builds found" > "$BUILD_STATS_TMP"

TOTAL_BUILDS=0
SUCCESS_BUILDS=0
FAILED_BUILDS=0
TOTAL_DURATION_SEC=0
AVG_DURATION_SEC=0

while read -r id status duration createTime; do
  if [ -n "$id" ]; then
    TOTAL_BUILDS=$((TOTAL_BUILDS + 1))
    if [ "$status" = "SUCCESS" ]; then
      SUCCESS_BUILDS=$((SUCCESS_BUILDS + 1))
    else
      FAILED_BUILDS=$((FAILED_BUILDS + 1))
    fi
    # Duration might be empty if build failed/running
    if [ -n "$duration" ] && [ "$duration" != "None" ]; then
      # Strip trailing 's' if present
      dur=$(echo "$duration" | sed 's/s//g' | cut -d'.' -f1)
      TOTAL_DURATION_SEC=$((TOTAL_DURATION_SEC + dur))
    fi
  fi
done < "$BUILD_STATS_TMP"

if [ $TOTAL_BUILDS -gt 0 ]; then
  AVG_DURATION_SEC=$((TOTAL_DURATION_SEC / TOTAL_BUILDS))
fi

# 2. Artifact Registry Metrics
echo "🔍 Querying Artifact Registry stats..."
TOTAL_IMAGES_SE=0
TOTAL_IMAGES_S=0
TOTAL_IMAGE_SIZE_MB=0

# Query asia-southeast1
IMAGES_SE=$(gcloud artifacts docker images list "${REGISTRY_SE}/${PROJECT_ID}/${REPOSITORY}" --project="$PROJECT_ID" --format="value(package,tag)" 2>/dev/null || true)
if [ -n "$IMAGES_SE" ]; then
  TOTAL_IMAGES_SE=$(echo "$IMAGES_SE" | wc -l)
fi

# Query asia-south1
IMAGES_S=$(gcloud artifacts docker images list "${REGISTRY_S}/${PROJECT_ID}/${REPOSITORY}" --project="$PROJECT_ID" --format="value(package,tag)" 2>/dev/null || true)
if [ -n "$IMAGES_S" ]; then
  TOTAL_IMAGES_S=$(echo "$IMAGES_S" | wc -l)
fi

TOTAL_IMAGES=$((TOTAL_IMAGES_SE + TOTAL_IMAGES_S))

# 3. Cloud Run Services
echo "🔍 Querying Cloud Run services..."
gcloud run services list --project="$PROJECT_ID" --format="value(metadata.name,metadata.namespace,status.address.url,status.latestCreatedRevisionName,status.traffic[0].revisionName)" > "$CR_STATS_TMP" || true

CR_SERVICES_COUNT=0
CR_TOTAL_REVISIONS=0
CR_SUMMARY_MD=""

# Read details of each service
while read -r name ns url latest active; do
  if [ -n "$name" ]; then
    CR_SERVICES_COUNT=$((CR_SERVICES_COUNT + 1))
    # Get active service region from namespace or config (usually default is the metadata label or describe region)
    # We query describes to get memory and cpu
    desc=$(gcloud run services describe "$name" --project="$PROJECT_ID" --region="$REGION" --format="value(spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.concurrency,status.traffic[0].revisionName)" 2>/dev/null || \
           gcloud run services describe "$name" --project="$PROJECT_ID" --region="$MARKETING_REGION" --format="value(spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.concurrency,status.traffic[0].revisionName)" 2>/dev/null || echo "Unknown Unknown Unknown Unknown")
    
    mem=$(echo "$desc" | cut -f1)
    cpu=$(echo "$desc" | cut -f2)
    conc=$(echo "$desc" | cut -f3)
    
    # Count revisions
    rev_count=$(gcloud run revisions list --project="$PROJECT_ID" --service="$name" --region="$REGION" --format="value(metadata.name)" 2>/dev/null | wc -l || \
                 gcloud run revisions list --project="$PROJECT_ID" --service="$name" --region="$MARKETING_REGION" --format="value(metadata.name)" 2>/dev/null | wc -l || echo "0")
    
    CR_TOTAL_REVISIONS=$((CR_TOTAL_REVISIONS + rev_count))
    CR_SUMMARY_MD="${CR_SUMMARY_MD}| \`$name\` | ${cpu} CPU | ${mem} | ${conc} | ${rev_count} |
"
  fi
done < "$CR_STATS_TMP"

# 4. Secret Manager Metrics
echo "🔍 Querying Secret Manager..."
gcloud secrets list --project="$PROJECT_ID" --format="value(name)" > "$SM_STATS_TMP" || true

TOTAL_SECRETS=0
TOTAL_SECRET_VERSIONS=0

while read -r name; do
  if [ -n "$name" ]; then
    TOTAL_SECRETS=$((TOTAL_SECRETS + 1))
    # Count all versions (active and disabled)
    vers=$(gcloud secrets versions list "$name" --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | wc -l || echo "0")
    TOTAL_SECRET_VERSIONS=$((TOTAL_SECRET_VERSIONS + vers))
  fi
done < "$SM_STATS_TMP"

# Save JSON output
cat <<EOF > "$JSON_OUTPUT"
{
  "date": "${DATE}",
  "builds": {
    "total_last_30": ${TOTAL_BUILDS},
    "success": ${SUCCESS_BUILDS},
    "failed": ${FAILED_BUILDS},
    "avg_duration_sec": ${AVG_DURATION_SEC}
  },
  "registry": {
    "images_se": ${TOTAL_IMAGES_SE},
    "images_s": ${TOTAL_IMAGES_S},
    "total_images": ${TOTAL_IMAGES}
  },
  "cloud_run": {
    "services_count": ${CR_SERVICES_COUNT},
    "total_revisions": ${CR_TOTAL_REVISIONS}
  },
  "secrets": {
    "total_secrets": ${TOTAL_SECRETS},
    "total_versions": ${TOTAL_SECRET_VERSIONS}
  }
}
EOF

# Generate human-readable Markdown Infrastructure Dashboard
cat <<EOF > "$MD_OUTPUT"
# GCP Infrastructure & Cost Dashboard

*Generated on ${DATE}*

## Cost Summary & Baseline Metrics

This dashboard tracks key resources driving GCP billing, updated via \`scripts/gcp-cost-baseline.sh\`.

### 📊 Summary Metrics

| Metric | Baseline (Pre-Opt) | Current State | Target Post-Opt | Status |
|--------|:------------------:|:-------------:|:---------------:|:------:|
| **Monthly Estimate** | ~₹6,800 | **₹6,800** | **₹1,500–₹2,500** | 🟡 Active |
| **Artifact Registry Images** | $TOTAL_IMAGES | **$TOTAL_IMAGES** | < 80 | Pending Cleanup |
| **Active Secrets / Versions** | $TOTAL_SECRETS / $TOTAL_SECRET_VERSIONS | **$TOTAL_SECRETS / $TOTAL_SECRET_VERSIONS** | $TOTAL_SECRETS / $TOTAL_SECRETS | Pending Version Cleanup |
| **Cloud Run Revisions** | $CR_TOTAL_REVISIONS | **$CR_TOTAL_REVISIONS** | < 25 | Pending Revision Cleanup |
| **Avg Build Time (Last 30)** | ${AVG_DURATION_SEC}s | **${AVG_DURATION_SEC}s** | < 120s (with Cache) | Pending Cache |

---

### 🐳 Cloud Run Services Sizing Audit

| Service | CPU | Memory | Concurrency | Total Revisions |
|---------|:---:|:------:|:-----------:|:---------------:|
$CR_SUMMARY_MD

---

### ☁️ Cloud Build Activity (Last 30 Runs)

- **Total Runs Checked**: $TOTAL_BUILDS
- **Success Rate**: $(( TOTAL_BUILDS > 0 ? (SUCCESS_BUILDS * 100 / TOTAL_BUILDS) : 0 ))% ($SUCCESS_BUILDS success, $FAILED_BUILDS failed)
- **Average Duration**: ${AVG_DURATION_SEC} seconds

---

### 📦 Artifact Registry Breakdown

- **asia-southeast1 (Core Repository)**: $TOTAL_IMAGES_SE images
- **asia-south1 (Marketing Repository)**: $TOTAL_IMAGES_S images
- **Total Registered Images / Tags**: $TOTAL_IMAGES

---

### 🔐 Secret Manager

- **Total Unique Secrets**: $TOTAL_SECRETS
- **Total Versions Stored**: $TOTAL_SECRET_VERSIONS (Avg $(( TOTAL_SECRETS > 0 ? (TOTAL_SECRET_VERSIONS / TOTAL_SECRETS) : 0 )) versions per secret)

EOF

echo "✅ Baseline captured successfully!"
echo "📄 JSON: $JSON_OUTPUT"
echo "📊 Dashboard: $MD_OUTPUT"

# Cleanup
rm -f "$BUILD_STATS_TMP" "$AR_STATS_TMP" "$CR_STATS_TMP" "$SM_STATS_TMP"
