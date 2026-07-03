#!/bin/bash
# Artifact Registry Native Policy Applicator & Manual Cleanup Tool
set -euo pipefail

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
REPOSITORY="quiz-platform"
REGIONS=("asia-southeast1" "asia-south1")
DRY_RUN=true

# Parse flags
while [[ $# -gt 0 ]]; do
  case $1 in
    --confirm)
      DRY_RUN=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--confirm]"
      exit 1
      ;;
  esac
done

if [ "$DRY_RUN" = true ]; then
  echo "⚖️  Running in DRY RUN mode. Pass --confirm to execute changes."
fi

# Step 1: Apply native lifecycle policies
for region in "${REGIONS[@]}"; do
  echo "🧹 Applying native cleanup policy to repository '$REPOSITORY' in region '$region'..."
  if [ "$DRY_RUN" = false ]; then
    gcloud artifacts repositories set-cleanup-policies "$REPOSITORY" \
      --project="$PROJECT_ID" \
      --location="$region" \
      --policy="scripts/ar-cleanup-policy.json" \
      --quiet
    echo "✅ Native policy applied."
  else
    echo "👉 [DRY RUN] Would run: gcloud artifacts repositories set-cleanup-policies $REPOSITORY --project=$PROJECT_ID --location=$region --policy=scripts/ar-cleanup-policy.json"
  fi
done

# Step 2: Query active Cloud Run images to ensure we NEVER delete them manually
echo "🔍 Querying active Cloud Run revisions to build safety exclusion list..."
ACTIVE_IMAGES=$(gcloud run revisions list --project="$PROJECT_ID" --format="value(spec.container.image)" --filter="status.conditions.type=Active AND status.conditions.status=True" 2>/dev/null || echo "")

# Add latest tags to exclusions
EXCLUDE_LIST=()
for img in $ACTIVE_IMAGES; do
  EXCLUDE_LIST+=("$img")
done

echo "🔒 Protection list compiled (${#EXCLUDE_LIST[@]} active container images protected)."

# Step 3: Optional manual clean of untagged/dangling digests (which native policies sometimes miss)
for region in "${REGIONS[@]}"; do
  echo "🔍 Scanning region '$region' for dangling/untagged digests..."
  
  # List all sub-packages (images) in repository
  PACKAGES=$(gcloud artifacts packages list --project="$PROJECT_ID" --repository="$REPOSITORY" --location="$region" --format="value(package)" 2>/dev/null || echo "")
  
  for pkg in $PACKAGES; do
    echo "  📦 Image package: $pkg"
    
    # Get all digests/versions
    DIGESTS=$(gcloud artifacts versions list --project="$PROJECT_ID" --repository="$REPOSITORY" --location="$region" --package="$pkg" --format="value(name,tags)" 2>/dev/null || echo "")
    
    if [ -z "$DIGESTS" ]; then
      continue
    fi
    
    while read -r digest tags; do
      [ -z "$digest" ] && continue
      
      # Determine if digest is untagged or has tags that are older
      # If tags is empty, it's untagged (dangling manifest)
      if [ -z "$tags" ] || [ "$tags" = "None" ]; then
        full_image_ref="${region}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${pkg}@${digest}"
        
        # Check safety list
        PROTECTED=false
        for protected_img in "${EXCLUDE_LIST[@]}"; do
          if [[ "$protected_img" == *"$digest"* ]]; then
            PROTECTED=true
            break
          fi
        done
        
        if [ "$PROTECTED" = true ]; then
          echo "    🔒 Skipping active digest: $digest (in use by Cloud Run)"
        else
          if [ "$DRY_RUN" = true ]; then
            echo "    🗑️  [DRY RUN] Would delete untagged version: $digest"
          else
            echo "    🗑️  Deleting untagged version: $digest"
            gcloud artifacts versions delete "$digest" \
              --project="$PROJECT_ID" \
              --repository="$REPOSITORY" \
              --location="$region" \
              --package="$pkg" \
              --quiet
          fi
        fi
      fi
    done <<< "$DIGESTS"
  done
done

echo "🎉 Artifact Registry cleanup policy update complete!"
