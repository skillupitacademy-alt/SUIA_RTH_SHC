#!/bin/bash

# Check SHC Admin logs for recent login activity
echo "🔍 Fetching SHC Admin logs from GCP..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Set project
gcloud config set project project-48af6a2d-e8bb-46dd-a58 --quiet

echo "📋 Recent logs (last 5 minutes):"
echo ""

# Fetch logs from the last 5 minutes
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skillhubcore-admin AND timestamp>=\"$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=100 \
  --format="table(timestamp,severity,jsonPayload.tag,jsonPayload.message,jsonPayload.onboardingCompleted,jsonPayload.status)" \
  --project=project-48af6a2d-e8bb-46dd-a58

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔍 Filtering for AUTH-related logs:"
echo ""

gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skillhubcore-admin AND (jsonPayload.tag=~\".*AUTH.*\" OR jsonPayload.tag=~\".*LOGIN.*\") AND timestamp>=\"$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=50 \
  --format=json \
  --project=project-48af6a2d-e8bb-46dd-a58 | jq -r '.[] | "\(.timestamp) [\(.severity)] \(.jsonPayload.tag // "NO_TAG"): \(.jsonPayload.message // .textPayload // "NO_MESSAGE") | onboardingCompleted=\(.jsonPayload.onboardingCompleted // "N/A") | status=\(.jsonPayload.status // "N/A")"'

echo ""
echo "✅ Log fetch complete!"
