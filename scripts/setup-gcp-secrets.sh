#!/bin/bash
set -euo pipefail

# Run this once to upload all env vars to GCP Secret Manager
# Usage: bash scripts/setup-gcp-secrets.sh

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
ENV_FILES=(
  "apps/api-server/.env.local"
  "apps/web-app/.env.local"
  "apps/admin-app/.env.local"
)

create_or_update_secret() {
  local name="$1"
  local value="$2"

  echo "Uploading secret: $name"
  if printf '%s' "$value" | gcloud secrets create "$name" \
    --data-file=- \
    --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Created secret: $name"
  else
    printf '%s' "$value" | gcloud secrets versions add "$name" \
      --data-file=- \
      --project="$PROJECT_ID" >/dev/null
    echo "Added new version: $name"
  fi
}

process_env_file() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    echo "Skipping missing file: $file_path"
    return
  fi

  echo "Processing $file_path"

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ -z "${line//[[:space:]]/}" ]]; then
      continue
    fi

    if [[ "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi

    if [[ "$line" != *"="* ]]; then
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"

    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"

    if [[ -z "$key" ]]; then
      continue
    fi

    if [[ "$key" == "REDIS_URL" ]]; then
      continue
    fi

    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    create_or_update_secret "$key" "$value"
  done < "$file_path"
}

echo "Uploading secrets to GCP Secret Manager for project: $PROJECT_ID"
echo "Make sure you are authenticated with gcloud and the project exists."

for env_file in "${ENV_FILES[@]}"; do
  process_env_file "$env_file"
done

echo "Secret upload complete."
