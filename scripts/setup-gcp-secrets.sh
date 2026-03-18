#!/bin/bash
# Run this once to upload all env vars to GCP Secret Manager
# Usage: bash scripts/setup-gcp-secrets.sh

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"

create_secret() {
  local name=$1
  local value=$2
  echo "Creating secret: $name"
  echo -n "$value" | gcloud secrets create "$name"     --data-file=-     --project="$PROJECT_ID" 2>/dev/null ||   echo -n "$value" | gcloud secrets versions add "$name"     --data-file=-     --project="$PROJECT_ID"
}

# Read from apps/api-server/.env.local and create secrets
# Run this script after setting your env vars below
# or pipe directly from .env.local

echo "Uploading secrets to GCP Secret Manager..."
echo "Make sure you are authenticated: gcloud auth login"
echo "And project is set: gcloud config set project $PROJECT_ID"
