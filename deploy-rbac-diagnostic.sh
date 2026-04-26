#!/bin/bash
# Deploy RBAC diagnostic code to production

set -e

echo "🔨 Building all packages..."
pnpm build:all

echo "📦 Building api-server Docker image..."
cd apps/api-server
gcloud builds submit --config=cloudbuild.yaml --region=asia-southeast1

echo "✅ Deployment complete!"
echo "🔍 Checking new revision..."
gcloud run services describe quiz-api-server --region=asia-southeast1 --format="value(status.latestReadyRevisionName)"

echo ""
echo "📊 Next steps:"
echo "1. Wait 30 seconds for the new revision to be ready"
echo "2. Run: node test-rbac-diagnostic.js"
echo "3. Check logs: gcloud logging read 'resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"quiz-api-server\"' --limit=50 --freshness=5m | grep RBAC"
