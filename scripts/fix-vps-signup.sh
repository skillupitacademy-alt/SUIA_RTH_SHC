#!/bin/bash

# VPS Signup Fix Deployment Script
# This script applies the cookie domain fix to your VPS deployment

set -e  # Exit on error

echo "🔧 VPS Signup Fix Deployment"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
  echo "❌ Error: No .env or .env.production file found"
  echo "Please create one with the required environment variables"
  exit 1
fi

# Check for required environment variables
echo "📋 Checking environment variables..."

check_env_var() {
  local var_name=$1
  local env_file=${2:-.env}
  
  if grep -q "^${var_name}=" "$env_file" 2>/dev/null; then
    local value=$(grep "^${var_name}=" "$env_file" | cut -d '=' -f2-)
    if [ -z "$value" ]; then
      echo "⚠️  Warning: $var_name is set but empty"
      return 1
    else
      echo "✅ $var_name is set"
      return 0
    fi
  else
    echo "❌ Missing: $var_name"
    return 1
  fi
}

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi

echo "Using environment file: $ENV_FILE"
echo ""

MISSING_VARS=0

# Check critical variables
if ! check_env_var "COOKIE_DOMAIN_RTH" "$ENV_FILE" && ! check_env_var "COOKIE_DOMAIN" "$ENV_FILE"; then
  echo "❌ Error: Neither COOKIE_DOMAIN_RTH nor COOKIE_DOMAIN is set"
  MISSING_VARS=1
fi

if ! check_env_var "COOKIE_DOMAIN_SKILLUP" "$ENV_FILE" && ! check_env_var "COOKIE_DOMAIN" "$ENV_FILE"; then
  echo "❌ Error: Neither COOKIE_DOMAIN_SKILLUP nor COOKIE_DOMAIN is set"
  MISSING_VARS=1
fi

check_env_var "GATEWAY_URL" "$ENV_FILE" || MISSING_VARS=1
check_env_var "GATEWAY_URL_SKILLUP" "$ENV_FILE" || MISSING_VARS=1
check_env_var "ALLOWED_ORIGINS" "$ENV_FILE" || MISSING_VARS=1

echo ""

if [ $MISSING_VARS -eq 1 ]; then
  echo "❌ Some required environment variables are missing or empty"
  echo ""
  echo "Please add the following to your $ENV_FILE:"
  echo ""
  echo "# Cookie Domains"
  echo "COOKIE_DOMAIN_RTH=.realtutorialhub.com"
  echo "COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com"
  echo ""
  echo "# Gateway URLs"
  echo "GATEWAY_URL=https://api.realtutorialhub.com"
  echo "GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com"
  echo ""
  echo "# CORS"
  echo "ALLOWED_ORIGINS=https://user.realtutorialhub.com,https://user.skillupitacademy.com"
  echo ""
  exit 1
fi

# Display current configuration
echo "📝 Current Cookie Domain Configuration:"
echo ""
COOKIE_DOMAIN_RTH=$(grep "^COOKIE_DOMAIN_RTH=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || grep "^COOKIE_DOMAIN=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || echo "NOT SET")
COOKIE_DOMAIN_SKILLUP=$(grep "^COOKIE_DOMAIN_SKILLUP=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || grep "^COOKIE_DOMAIN=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- || echo "NOT SET")

echo "RTH Cookie Domain:    $COOKIE_DOMAIN_RTH"
echo "SkillUp Cookie Domain: $COOKIE_DOMAIN_SKILLUP"
echo ""

read -p "Does this look correct? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted. Please update your $ENV_FILE and try again."
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is not installed"
  exit 1
fi

echo ""
echo "🔨 Building application..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build packages (auth package was modified)
echo "🏗️  Building packages..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""

# Check if PM2 is being used
if command -v pm2 &> /dev/null; then
  echo "🔄 Detected PM2. Restarting processes..."
  pm2 restart all
  echo "✅ PM2 processes restarted"
  echo ""
  echo "📊 PM2 Status:"
  pm2 list
elif [ -f "docker-compose.yml" ]; then
  echo "🐳 Detected Docker Compose. Restarting services..."
  docker-compose restart
  echo "✅ Docker services restarted"
elif systemctl is-active --quiet nginx; then
  echo "🔄 Detected systemd services. Please restart manually:"
  echo "   sudo systemctl restart your-app-service"
else
  echo "⚠️  Could not detect process manager. Please restart your services manually:"
  echo "   - If using PM2: pm2 restart all"
  echo "   - If using Docker: docker-compose restart"
  echo "   - If using systemd: sudo systemctl restart your-service"
fi

echo ""
echo "🧪 Testing Authentication Flow..."
echo ""

# Test if services are responding
GATEWAY_URL=$(grep "^GATEWAY_URL=" "$ENV_FILE" | head -1 | cut -d '=' -f2-)

if [ -n "$GATEWAY_URL" ]; then
  echo "Testing API health: $GATEWAY_URL/healthz"
  
  if curl -f -s "${GATEWAY_URL}/healthz" > /dev/null 2>&1; then
    echo "✅ API is responding"
  else
    echo "⚠️  API health check failed. Services might still be starting..."
  fi
else
  echo "⚠️  Could not determine GATEWAY_URL for testing"
fi

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Clear browser cookies for your domain"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Test signup flow at:"
echo "   - https://user.realtutorialhub.com/signup"
echo "   - https://user.skillupitacademy.com/signup"
echo ""
echo "4. In DevTools (F12), verify cookies are set with correct domain:"
echo "   Application → Cookies → Check 'accessToken' and 'refreshToken'"
echo ""
echo "🐛 If issues persist:"
echo "   - Check logs: pm2 logs (or docker-compose logs)"
echo "   - Enable debug: LOG_LEVEL=debug in $ENV_FILE"
echo "   - See VPS_SIGNUP_FIX.md for detailed troubleshooting"
echo ""
echo "📞 Need help? Check the logs and VPS_SIGNUP_FIX.md guide"
echo ""
