#!/bin/bash

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REGION="asia-southeast1"

echo "🔍 ANALYZING BFF SSR LOGS"
echo "========================================"
echo ""

echo "📊 Step 1: Check for DASHBOARD_SSR logs"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   textPayload=~"DASHBOARD_SSR"' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=$PROJECT_ID \
  --freshness=1h

echo ""
echo "📊 Step 2: Check for AUTH_STATE logs"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   textPayload=~"AUTH_STATE"' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=$PROJECT_ID \
  --freshness=1h

echo ""
echo "📊 Step 3: Check for BFF Profile GET logs"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   textPayload=~"Profile GET"' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=$PROJECT_ID \
  --freshness=1h

echo ""
echo "📊 Step 4: Check for BFF auth failures"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   (textPayload=~"Auth FAILED" OR textPayload=~"401" OR textPayload=~"403")' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=$PROJECT_ID \
  --freshness=1h

echo ""
echo "📊 Step 5: Check for requireBffAuth logs"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   textPayload=~"requireBffAuth"' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=$PROJECT_ID \
  --freshness=1h

echo ""
echo "📊 Step 6: Check for JWT validation errors"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   (textPayload=~"JWT" OR textPayload=~"token")' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=$PROJECT_ID \
  --freshness=1h

echo ""
echo "📊 Step 7: Check for middleware logs"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="realtutorialhub-web"
   textPayload=~"BFF_GATEWAY_SECRET"' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=$PROJECT_ID \
  --freshness=1h

echo ""
echo "✅ Log analysis complete"
echo ""
echo "🔍 SUMMARY:"
echo "- Look for AUTH_STATE logs showing response status"
echo "- Check if Profile GET shows 'Auth FAILED'"
echo "- Verify if JWT validation is failing"
echo "- Check if middleware is blocking localhost calls"
