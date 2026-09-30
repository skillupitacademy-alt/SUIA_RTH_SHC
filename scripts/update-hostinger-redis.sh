#!/usr/bin/env bash
# Update Upstash Redis credentials on Hostinger VPS
# Usage: ./update-hostinger-redis.sh <NEW_UPSTASH_URL> <NEW_UPSTASH_TOKEN>

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <UPSTASH_REDIS_REST_URL> <UPSTASH_REDIS_REST_TOKEN>"
  echo ""
  echo "Example:"
  echo "  $0 'https://your-new-instance.upstash.io' 'AXz...token'"
  exit 1
fi

NEW_URL="$1"
NEW_TOKEN="$2"

echo "========================================"
echo "UPDATE HOSTINGER REDIS CREDENTIALS"
echo "========================================"
echo ""
echo "⚠️  This will update Redis credentials in:"
echo "   - /opt/platform/env/shared/.env"
echo "   - /opt/platform/env/.env.production"
echo ""
echo "New URL: $NEW_URL"
echo "New Token: ${NEW_TOKEN:0:20}..."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Step 1: Backup current environment files..."
ssh root@72.61.115.49 "
  cp /opt/platform/env/shared/.env /opt/platform/env/shared/.env.backup-\$(date +%Y%m%d-%H%M%S)
  cp /opt/platform/env/.env.production /opt/platform/env/.env.production.backup-\$(date +%Y%m%d-%H%M%S)
"
echo "✅ Backups created"

echo ""
echo "Step 2: Update shared/.env..."
ssh root@72.61.115.49 "
  sed -i 's|^UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$NEW_URL|' /opt/platform/env/shared/.env
  sed -i 's|^UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$NEW_TOKEN|' /opt/platform/env/shared/.env
"
echo "✅ Updated /opt/platform/env/shared/.env"

echo ""
echo "Step 3: Update .env.production..."
ssh root@72.61.115.49 "
  sed -i 's|^UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$NEW_URL|' /opt/platform/env/.env.production
  sed -i 's|^UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$NEW_TOKEN|' /opt/platform/env/.env.production
"
echo "✅ Updated /opt/platform/env/.env.production"

echo ""
echo "Step 4: Restart affected services..."
ssh root@72.61.115.49 "
  cd /opt/platform/runtime
  docker compose restart api-server realtutorialhub-web skillhubcore-service skillup-web
"
echo "✅ Services restarted"

echo ""
echo "Step 5: Verify Redis connection..."
sleep 5
ssh root@72.61.115.49 "
  docker exec quiz-platform-api-server-1 node -e '
    const https = require(\"https\");
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    console.log(\"Testing new Upstash connection...\");
    const testUrl = url + \"/ping\";
    https.get(testUrl, { headers: { \"Authorization\": \"Bearer \" + token } }, (res) => {
      console.log(\"HTTP Status:\", res.statusCode);
      let data = \"\";
      res.on(\"data\", chunk => data += chunk);
      res.on(\"end\", () => {
        console.log(\"Response:\", data);
        process.exit(res.statusCode === 200 ? 0 : 1);
      });
    }).on(\"error\", (e) => {
      console.error(\"Error:\", e.message);
      process.exit(1);
    });
  '
"

if [ $? -eq 0 ]; then
  echo ""
  echo "========================================"
  echo "✅ REDIS UPDATE SUCCESSFUL!"
  echo "========================================"
  echo ""
  echo "Monitor logs:"
  echo "  ssh root@72.61.115.49"
  echo "  docker logs quiz-platform-api-server-1 --tail 50 -f"
else
  echo ""
  echo "========================================"
  echo "⚠️  REDIS CONNECTION FAILED"
  echo "========================================"
  echo ""
  echo "Check the credentials and try again."
  echo "Backups are available in /opt/platform/env/*.backup-*"
fi
