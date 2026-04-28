#!/bin/bash

#############################################
# 🔍 DEPLOYMENT PREREQUISITES CHECKER
#############################################

echo "🔍 Checking deployment prerequisites..."
echo "========================================"
echo ""

ISSUES_FOUND=0

#############################################
# 1. Check Python
#############################################

echo "1️⃣  Checking Python..."

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo "   ✅ $PYTHON_VERSION"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    echo "   ✅ $PYTHON_VERSION"
else
    echo "   ❌ Python is NOT installed"
    echo ""
    echo "   📥 Installation options:"
    echo ""
    echo "   Option 1: Microsoft Store (Recommended for Windows)"
    echo "   ----------------------------------------"
    echo "   1. Open Microsoft Store"
    echo "   2. Search for 'Python 3.12'"
    echo "   3. Click 'Get' or 'Install'"
    echo "   4. Wait for installation to complete"
    echo ""
    echo "   Option 2: Official Python Installer"
    echo "   ----------------------------------------"
    echo "   1. Visit: https://www.python.org/downloads/"
    echo "   2. Download the latest Python 3.x installer"
    echo "   3. Run the installer"
    echo "   4. ✅ IMPORTANT: Check 'Add Python to PATH'"
    echo "   5. Click 'Install Now'"
    echo ""
    echo "   After installation:"
    echo "   - Close and reopen your terminal"
    echo "   - Verify: python --version"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

#############################################
# 2. Check Google Cloud SDK
#############################################

echo "2️⃣  Checking Google Cloud SDK..."

if command -v gcloud &> /dev/null; then
    GCLOUD_VERSION=$(gcloud version --format="value(version)" 2>/dev/null || echo "unknown")
    echo "   ✅ gcloud $GCLOUD_VERSION"
    
    # Check if gcloud is authenticated
    ACCOUNT=$(gcloud config get-value account 2>/dev/null)
    if [ -n "$ACCOUNT" ]; then
        echo "   ✅ Authenticated as: $ACCOUNT"
    else
        echo "   ⚠️  Not authenticated"
        echo "   Run: gcloud auth login"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check if project is set
    PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ -n "$PROJECT" ]; then
        echo "   ✅ Project: $PROJECT"
    else
        echo "   ⚠️  No project set"
        echo "   Run: gcloud config set project YOUR_PROJECT_ID"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo "   ❌ Google Cloud SDK is NOT installed"
    echo ""
    echo "   📥 Installation:"
    echo "   1. Visit: https://cloud.google.com/sdk/docs/install"
    echo "   2. Download the installer for Windows"
    echo "   3. Run the installer"
    echo "   4. Follow the setup wizard"
    echo "   5. Restart your terminal"
    echo ""
    echo "   After installation:"
    echo "   - Run: gcloud init"
    echo "   - Authenticate with your Google account"
    echo "   - Select your project"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

#############################################
# 3. Check Docker
#############################################

echo "3️⃣  Checking Docker..."

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>&1)
    echo "   ✅ $DOCKER_VERSION"
    
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo "   ✅ Docker daemon is running"
    else
        echo "   ⚠️  Docker daemon is NOT running"
        echo "   Start Docker Desktop"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo "   ❌ Docker is NOT installed"
    echo ""
    echo "   📥 Installation:"
    echo "   1. Visit: https://www.docker.com/products/docker-desktop"
    echo "   2. Download Docker Desktop for Windows"
    echo "   3. Run the installer"
    echo "   4. Restart your computer if prompted"
    echo "   5. Start Docker Desktop"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

#############################################
# 4. Check Node.js and pnpm
#############################################

echo "4️⃣  Checking Node.js and pnpm..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>&1)
    echo "   ✅ Node.js $NODE_VERSION"
else
    echo "   ❌ Node.js is NOT installed"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version 2>&1)
    echo "   ✅ pnpm $PNPM_VERSION"
else
    echo "   ⚠️  pnpm is NOT installed"
    echo "   Run: npm install -g pnpm"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

#############################################
# 5. Check Git
#############################################

echo "5️⃣  Checking Git..."

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version 2>&1)
    echo "   ✅ $GIT_VERSION"
else
    echo "   ❌ Git is NOT installed"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

#############################################
# SUMMARY
#############################################

echo "========================================"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ All prerequisites are met!"
    echo "   You can run: ./scripts/deploy-direct.sh"
    echo ""
    exit 0
else
    echo "❌ Found $ISSUES_FOUND issue(s)"
    echo ""
    echo "Please fix the issues above before deploying."
    echo ""
    echo "Quick fixes:"
    echo "  - Python: Install from Microsoft Store or python.org"
    echo "  - gcloud: Install from cloud.google.com/sdk"
    echo "  - Docker: Install Docker Desktop"
    echo ""
    echo "After fixing, run this script again to verify."
    echo ""
    exit 1
fi
