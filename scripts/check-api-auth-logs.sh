#!/bin/bash

echo "🔍 CHECKING API SERVER AUTH LOGS"
echo "========================================"

echo ""
echo "📊 Step 1: Check for API AUTH validation logs"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision" 
   AND resource.labels.service_name="quiz-api-server" 
   AND (textPayload=~"API_AUTH" OR textPayload=~"AUTH\]")' \
  --limit=30 \
  --format="table(timestamp, textPayload)" \
  --project=project-48af6a2d-e8bb-46dd-a58

echo ""
echo "📊 Step 2: Check for INTERNAL_API_SECRET validation"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision" 
   AND resource.labels.service_name="quiz-api-server" 
   AND textPayload=~"INTERNAL"' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=project-48af6a2d-e8bb-46dd-a58

echo ""
echo "📊 Step 3: Check for 401 responses"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision" 
   AND resource.labels.service_name="quiz-api-server" 
   AND (textPayload=~"401" OR httpRequest.status=401)' \
  --limit=20 \
  --format="table(timestamp, textPayload, httpRequest.status)" \
  --project=project-48af6a2d-e8bb-46dd-a58

echo ""
echo "📊 Step 4: Check for secret mismatch errors"
echo "----------------------------------------"
gcloud logging read \
  'resource.type="cloud_run_revision" 
   AND resource.labels.service_name="quiz-api-server" 
   AND (textPayload=~"secret" OR textPayload=~"Secret")' \
  --limit=20 \
  --format="table(timestamp, textPayload)" \
  --project=project-48af6a2d-e8bb-46dd-a58

echo ""
echo "✅ API log analysis complete"
