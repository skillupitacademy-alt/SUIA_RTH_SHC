#!/bin/bash
set -euo pipefail

# Scripts to clean up old, inactive secret versions in GCP Secret Manager to reduce costs
# Does not delete the secrets themselves, only previous versions.

PROJECT_ID="${PROJECT_ID:-project-48af6a2d-e8bb-46dd-a58}"
DRY_RUN=true

if [ "${1:-}" = "--confirm" ]; then
  DRY_RUN=false
  echo "🚀 Running in execution mode: Old secret versions WILL be destroyed."
else
  echo "🔍 Running in DRY-RUN mode: No versions will be destroyed."
  echo "   Use --confirm to actually destroy versions."
fi

echo "Fetching all secrets in project $PROJECT_ID..."
SECRETS=$(gcloud secrets list --project="$PROJECT_ID" --format="value(name.basename())")

if [ -z "$SECRETS" ]; then
  echo "No secrets found."
  exit 0
fi

TOTAL_DESTROYED=0

for secret in $SECRETS; do
  echo "Checking secret: $secret"
  
  # Get all versions, excluding the one alias'd as 'latest' and those already DESTROYED
  # gcloud secrets versions list returns: NAME STATE CREATED
  
  # Find which version is latest
  LATEST_VERSION=$(gcloud secrets versions describe latest --secret="$secret" --project="$PROJECT_ID" --format="value(name)" 2>/dev/null || echo "")
  
  if [ -z "$LATEST_VERSION" ]; then
    echo "  ⚠️ Cannot determine latest version. Skipping."
    continue
  fi
  
  # List all enabled or disabled versions (not destroyed)
  VERSIONS_TO_DESTROY=$(gcloud secrets versions list "$secret" --project="$PROJECT_ID" \
    --filter="state!=DESTROYED AND name!=$LATEST_VERSION" \
    --format="value(name)")
    
  if [ -z "$VERSIONS_TO_DESTROY" ]; then
    echo "  ✅ Only latest version ($LATEST_VERSION) is active. Nothing to clean."
    continue
  fi
  
  for version in $VERSIONS_TO_DESTROY; do
    if [ "$DRY_RUN" = true ]; then
      echo "  [DRY-RUN] Would destroy version $version (latest is $LATEST_VERSION)"
    else
      echo "  🗑️ Destroying version $version (latest is $LATEST_VERSION)..."
      gcloud secrets versions destroy "$version" --secret="$secret" --project="$PROJECT_ID" --quiet
      TOTAL_DESTROYED=$((TOTAL_DESTROYED + 1))
    fi
  done
done

echo ""
if [ "$DRY_RUN" = true ]; then
  echo "🏁 DRY-RUN complete. Run with --confirm to execute."
else
  echo "🏁 Cleanup complete. Destroyed $TOTAL_DESTROYED old secret versions."
fi
