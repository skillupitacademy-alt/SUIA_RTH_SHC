#!/bin/bash

# Check RTH BFF logs for dashboard SSR issues
echo "🔍 Checking RTH BFF logs for dashboard SSR..."
echo ""

gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   (textPayload=~"DASHBOARD_SSR" OR textPayload=~"AUTH_STATE")' \
  --limit=50 \
  --format="table(timestamp, textPayload)" \
  --project=project-48af6a2d-e8bb-46dd-a58

echo ""
echo "✅ Log check complete"
