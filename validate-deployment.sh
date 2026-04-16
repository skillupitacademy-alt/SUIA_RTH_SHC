#!/bin/bash

# Production Deployment Validation Script
# Runs the complete validation pipeline before deployment

set -e

echo "🚀 Production Deployment Validation Pipeline"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the quiz-platform root directory"
    exit 1
fi

echo "📋 Validation Steps:"
echo "1. Lint Check"
echo "2. Type Check" 
echo "3. Build"
echo "4. Test Script Execution"
echo "5. Docker Image Build (local)"
echo "6. Ready for Deployment"
echo ""

# Step 1: Lint Check
echo "🔍 Step 1: Running Lint Check..."
if pnpm run lint; then
    echo "✅ Lint check passed"
else
    echo "❌ Lint check failed"
    exit 1
fi
echo ""

# Step 2: Type Check
echo "🔍 Step 2: Running Type Check..."
if pnpm run type-check; then
    echo "✅ Type check passed"
else
    echo "❌ Type check failed"
    exit 1
fi
echo ""

# Step 3: Build
echo "🔍 Step 3: Running Build..."
if pnpm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

# Step 4: Test Script Execution
echo "🔍 Step 4: Running Test Scripts..."
if pnpm run test; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi
echo ""

# Step 5: Docker Image Build (local)
echo "🔍 Step 5: Building Local Docker Images..."

# Build RTH Web Docker Image
echo "📦 Building realtutorialhub-web Docker image..."
if docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api \
    --build-arg NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_SITE_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_APP_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_LOGIN_URL=https://user.realtutorialhub.com/login \
    -f apps/realtutorialhub-web/Dockerfile \
    -t realtutorialhub-web:local-test \
    .; then
    echo "✅ RTH Web Docker image built successfully"
else
    echo "❌ RTH Web Docker build failed"
    exit 1
fi

# Build SkillUp Web Docker Image
echo "📦 Building skillup-web Docker image..."
if docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.skillupitacademy.com/api \
    -f apps/skillup-web/Dockerfile \
    -t skillup-web:local-test \
    .; then
    echo "✅ SkillUp Web Docker image built successfully"
else
    echo "❌ SkillUp Web Docker build failed"
    exit 1
fi

# Build API Server Docker Image
echo "📦 Building api-server Docker image..."
if docker build \
    --build-arg NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api \
    --build-arg NEXT_PUBLIC_WEB_APP_URL=https://user.realtutorialhub.com \
    --build-arg NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com \
    -f apps/api-server/Dockerfile \
    -t api-server:local-test \
    .; then
    echo "✅ API Server Docker image built successfully"
else
    echo "❌ API Server Docker build failed"
    exit 1
fi

echo ""
echo "🎉 All Validation Steps Completed Successfully!"
echo ""
echo "📋 Ready for Production Deployment:"
echo "✅ Lint check passed"
echo "✅ Type check passed"
echo "✅ Build successful"
echo "✅ Tests passed"
echo "✅ Docker images built locally"
echo ""
echo "🚀 Next Steps:"
echo "1. Commit changes: git add . && git commit -m 'Deploy shared branding fix'"
echo "2. Cloudflare Workers: npx wrangler deploy"
echo "3. Google Cloud Run: gcloud run deploy"
echo "4. GitHub Deployment: gh workflow run deploy-cloudrun.yml"
echo ""
echo "🔗 Deployment Commands Ready!"