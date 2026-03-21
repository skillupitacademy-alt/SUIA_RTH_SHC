#!/bin/bash
# ============================================================
# GCP SECRETS UPSERT — All 59 keys from root .env.local
# Create if not exists. Update if already exists.
# ============================================================
# BEFORE RUNNING — fix these 2 things in .env.local first:
#   1. Regenerate JWT_SECRET (currently same as ADMIN_JWT_SECRET)
#      node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
#   2. Fix DATABASE_URL_PAYMENT + DATABASE_DIRECT_URL_PAYMENT
#      Must point to payment_prod database (currently points to neondb)
# ============================================================
# Run from: d:\onlinewebsites\quiz-platform\
# Command:  bash add_or_update_secrets.sh
# ============================================================

PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"
ENV_FILE=".env.local"

gcloud config set project $PROJECT_ID
echo ""
echo "Project: $(gcloud config get-value project)"
echo "Reading: $ENV_FILE"
echo "============================================"

upsert_secret() {
  local SECRET_NAME=$1
  local SECRET_VALUE=$2

  if [ -z "$SECRET_VALUE" ]; then
    echo "SKIP    -> $SECRET_NAME (not in $ENV_FILE)"
    return
  fi

  if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
    echo "UPDATE  -> $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" \
      --data-file=- --project="$PROJECT_ID" --quiet
  else
    echo "CREATE  -> $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" \
      --data-file=- --replication-policy=automatic \
      --project="$PROJECT_ID" --quiet
  fi
}

get_env() {
  local RAW
  RAW=$(grep "^$1=" "$ENV_FILE" | cut -d '=' -f2-)
  RAW="${RAW%\"}"
  RAW="${RAW#\"}"
  echo "$RAW"
}

# ============================================================
echo ""; echo "--- Auth and JWT ---"
upsert_secret "ADMIN_JWT_SECRET"              "$(get_env ADMIN_JWT_SECRET)"
upsert_secret "JWT_SECRET"                    "$(get_env JWT_SECRET)"
upsert_secret "JWT_REFRESH_SECRET"            "$(get_env JWT_REFRESH_SECRET)"
upsert_secret "CSRF_SECRET"                   "$(get_env CSRF_SECRET)"
upsert_secret "CRON_SECRET"                   "$(get_env CRON_SECRET)"
upsert_secret "INTERNAL_API_KEY"              "$(get_env INTERNAL_API_KEY)"
upsert_secret "MIGRATION_SECRET"              "$(get_env MIGRATION_SECRET)"

echo ""; echo "--- Databases Exam Engine ---"
upsert_secret "DATABASE_URL"                  "$(get_env DATABASE_URL)"
upsert_secret "DATABASE_DIRECT_URL"           "$(get_env DATABASE_DIRECT_URL)"

echo ""; echo "--- Databases Window 2 and 3 ---"
upsert_secret "DATABASE_URL_TUTORIAL"         "$(get_env DATABASE_URL_TUTORIAL)"
upsert_secret "DATABASE_DIRECT_URL_TUTORIAL"  "$(get_env DATABASE_DIRECT_URL_TUTORIAL)"
upsert_secret "DATABASE_URL_PEOPLE"           "$(get_env DATABASE_URL_PEOPLE)"
upsert_secret "DATABASE_DIRECT_URL_PEOPLE"    "$(get_env DATABASE_DIRECT_URL_PEOPLE)"
upsert_secret "DATABASE_URL_PAYMENT"          "$(get_env DATABASE_URL_PAYMENT)"
upsert_secret "DATABASE_DIRECT_URL_PAYMENT"   "$(get_env DATABASE_DIRECT_URL_PAYMENT)"
upsert_secret "DATABASE_URL_PLACEMENT"        "$(get_env DATABASE_URL_PLACEMENT)"
upsert_secret "DATABASE_DIRECT_URL_PLACEMENT" "$(get_env DATABASE_DIRECT_URL_PLACEMENT)"

echo ""; echo "--- Upstash Redis ---"
upsert_secret "REDIS_URL"                     "$(get_env REDIS_URL)"
upsert_secret "REDIS_MEMORY_LIMIT_MB"         "$(get_env REDIS_MEMORY_LIMIT_MB)"
upsert_secret "UPSTASH_REDIS_REST_URL"        "$(get_env UPSTASH_REDIS_REST_URL)"
upsert_secret "UPSTASH_REDIS_REST_TOKEN"      "$(get_env UPSTASH_REDIS_REST_TOKEN)"
upsert_secret "UPSTASH_VECTOR_REST_URL"       "$(get_env UPSTASH_VECTOR_REST_URL)"
upsert_secret "UPSTASH_VECTOR_REST_TOKEN"     "$(get_env UPSTASH_VECTOR_REST_TOKEN)"

echo ""; echo "--- QStash ---"
upsert_secret "QSTASH_URL"                    "$(get_env QSTASH_URL)"
upsert_secret "QSTASH_TOKEN"                  "$(get_env QSTASH_TOKEN)"
upsert_secret "QSTASH_CURRENT_SIGNING_KEY"    "$(get_env QSTASH_CURRENT_SIGNING_KEY)"
upsert_secret "QSTASH_NEXT_SIGNING_KEY"       "$(get_env QSTASH_NEXT_SIGNING_KEY)"
upsert_secret "QUEUE_ENABLED"                 "$(get_env QUEUE_ENABLED)"

echo ""; echo "--- Email ---"
upsert_secret "RESEND_API_KEY"                "$(get_env RESEND_API_KEY)"
upsert_secret "EMAIL_FROM"                    "$(get_env EMAIL_FROM)"
upsert_secret "EMAIL_PROVIDER"                "$(get_env EMAIL_PROVIDER)"

echo ""; echo "--- Storage ---"
upsert_secret "BLOB_READ_WRITE_TOKEN"         "$(get_env BLOB_READ_WRITE_TOKEN)"
upsert_secret "STORAGE_PROVIDER"              "$(get_env STORAGE_PROVIDER)"
upsert_secret "R2_ENDPOINT"                   "$(get_env R2_ENDPOINT)"
upsert_secret "R2_BUCKET"                     "$(get_env R2_BUCKET)"
upsert_secret "R2_ACCESS_KEY_ID"              "$(get_env R2_ACCESS_KEY_ID)"
upsert_secret "R2_SECRET_ACCESS_KEY"          "$(get_env R2_SECRET_ACCESS_KEY)"

echo ""; echo "--- Sentry ---"
upsert_secret "NEXT_PUBLIC_SENTRY_DSN"        "$(get_env NEXT_PUBLIC_SENTRY_DSN)"
upsert_secret "SENTRY_AUTH_TOKEN"             "$(get_env SENTRY_AUTH_TOKEN)"
upsert_secret "SENTRY_ORG"                    "$(get_env SENTRY_ORG)"
upsert_secret "SENTRY_PROJECT"                "$(get_env SENTRY_PROJECT)"

echo ""; echo "--- Cloudflare ---"
upsert_secret "CLOUDFLARE_API_TOKEN"          "$(get_env CLOUDFLARE_API_TOKEN)"
upsert_secret "CLOUDFLARE_ZONE_ID"            "$(get_env CLOUDFLARE_ZONE_ID)"

echo ""; echo "--- App URLs ---"
upsert_secret "NEXT_PUBLIC_API_URL"           "$(get_env NEXT_PUBLIC_API_URL)"
upsert_secret "NEXT_PUBLIC_WEB_APP_URL"       "$(get_env NEXT_PUBLIC_WEB_APP_URL)"
upsert_secret "NEXT_PUBLIC_ADMIN_URL"         "$(get_env NEXT_PUBLIC_ADMIN_URL)"

echo ""; echo "--- App Config ---"
upsert_secret "ALLOWED_ORIGINS"               "$(get_env ALLOWED_ORIGINS)"
upsert_secret "COOKIE_DOMAIN"                 "$(get_env COOKIE_DOMAIN)"
upsert_secret "NODE_ENV"                      "$(get_env NODE_ENV)"
upsert_secret "LOG_LEVEL"                     "$(get_env LOG_LEVEL)"
upsert_secret "PASS_THRESHOLD"                "$(get_env PASS_THRESHOLD)"
upsert_secret "SAFE_MODE"                     "$(get_env SAFE_MODE)"
upsert_secret "HIGH_LOAD_MODE"                "$(get_env HIGH_LOAD_MODE)"
upsert_secret "ALLOW_MOCK_JOBS"               "$(get_env ALLOW_MOCK_JOBS)"
upsert_secret "ANALYZE"                       "$(get_env ANALYZE)"
upsert_secret "FEATURE_FLAGS"                 "$(get_env FEATURE_FLAGS)"
upsert_secret "REPORT_STUCK_THRESHOLD_MS"     "$(get_env REPORT_STUCK_THRESHOLD_MS)"
upsert_secret "SERVICE_USAGE_CACHE_TTL_SEC"   "$(get_env SERVICE_USAGE_CACHE_TTL_SEC)"
upsert_secret "SERVICE_USAGE_TIMEOUT_MS"      "$(get_env SERVICE_USAGE_TIMEOUT_MS)"
upsert_secret "DISABLE_BACKGROUND_WORKERS"    "$(get_env DISABLE_BACKGROUND_WORKERS)"
upsert_secret "INTERNAL_API_URL"              "$(get_env INTERNAL_API_URL)"
upsert_secret "BROWSERLESS_URL"               "$(get_env BROWSERLESS_URL)"
upsert_secret "NEXT_PUBLIC_DEBUG_PDF_BORDERS" "$(get_env NEXT_PUBLIC_DEBUG_PDF_BORDERS)"
upsert_secret "NEXT_PUBLIC_GITHUB_URL"        "$(get_env NEXT_PUBLIC_GITHUB_URL)"
upsert_secret "SYNC_SCORING_FALLBACK"        "$(get_env SYNC_SCORING_FALLBACK)"

# ============================================================
echo ""
echo "============================================"
echo "Done. All keys processed."
echo ""
gcloud secrets list --project="$PROJECT_ID" \
  --format="table(name)" --sort-by=name
echo ""
echo "Total secrets in GCP:"
gcloud secrets list --project="$PROJECT_ID" --format="value(name)" | wc -l
