#!/bin/bash
SECRETS=(
  "ANALYTICS_ADMIN_TOKEN"
  "RTH_GA4_MEASUREMENT_API_SECRET"
  "RTH_META_CAPI_TOKEN"
  "SUIA_GA4_MEASUREMENT_API_SECRET"
  "SUIA_META_CAPI_TOKEN"
)
PROJECT="project-48af6a2d-e8bb-46dd-a58"

for s in "${SECRETS[@]}"; do
  echo "Creating $s"
  gcloud secrets create "$s" --replication-policy="automatic" --project="$PROJECT" 2>/dev/null || true
  echo -n "dummy" | gcloud secrets versions add "$s" --data-file=- --project="$PROJECT"
done
