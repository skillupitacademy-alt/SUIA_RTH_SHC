# 🚀 VPS Build Optimization Solutions

## Problem Analysis

### Current Situation
Your `build.sh` script builds **10 Docker images simultaneously**, each running:
- Next.js build (heavy JavaScript compilation)
- TypeScript compilation
- Webpack bundling
- Turbo build with concurrency=20

**This causes**:
- CPU usage spikes to 90-100%
- RAM exhaustion (swapping)
- Server becomes unresponsive
- Build failures due to OOM (Out of Memory)

### What Your Screenshot Shows
- **CPU usage**: Spiking to 100% during builds
- **RAM usage**: Hitting limits
- **Disk I/O**: High outgoing traffic (build artifacts)

---

## 📊 Root Causes

### 1. **10 Services Building in Parallel**
```bash
docker compose build --pull
```
Builds ALL 10 services simultaneously:
- api-server
- realtutorialhub-quiz
- realtutorialhub-admin
- realtutorialhub-web
- skillup-web
- skillup-admin
- faculty-app
- skillhubcore-admin
- skillhub-placement
- skillhubcore-service

### 2. **Turbo Concurrency Too High**
```json
{
  "concurrency": "20"  // ❌ Too high for VPS!
}
```

### 3. **No Build Limits in Docker Compose**
Docker Compose doesn't limit resources during build by default.

### 4. **No Build Caching Strategy**
Each build pulls and rebuilds everything, even unchanged services.

---

## ✅ Solution 1: Limit Docker Build Concurrency (EASIEST)

### Implementation
Limit how many Docker images build at once.

**Create**: `infra/hostinger/scripts/build-optimized.sh`

```bash
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

print_context
require_command docker
require_file "$ENV_FILE"
require_file "$COMPOSE_BASE"
require_file "$COMPOSE_PROD"

echo "🚀 Starting optimized build for VPS"
echo "   Building services in batches to prevent CPU overload"
echo ""

# Group 1: Core services (API + RTH Web)
echo "📦 Group 1: Building core services..."
compose build --pull api-server realtutorialhub-web

# Group 2: RTH services
echo "📦 Group 2: Building RTH services..."
compose build realtutorialhub-quiz realtutorialhub-admin

# Group 3: SkillUp services
echo "📦 Group 3: Building SkillUp services..."
compose build skillup-web skillup-admin faculty-app

# Group 4: SkillHub services
echo "📦 Group 4: Building SkillHub services..."
compose build skillhubcore-admin skillhub-placement skillhubcore-service

echo "✅ All services built successfully!"
```

**Benefits**:
- ✅ Builds 2-3 services at a time instead of 10
- ✅ CPU stays under 50%
- ✅ No OOM kills
- ✅ Easy to implement (just use new script)

**Usage**:
```bash
./infra/hostinger/scripts/build-optimized.sh
```

---

## ✅ Solution 2: Lower Turbo Concurrency for VPS

### Implementation
Create VPS-specific turbo configuration.

**Create**: `turbo.vps.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "extends": ["./turbo.json"],
  "concurrency": "2"
}
```

**Update Dockerfiles** to use this in production:
```dockerfile
# Add before build command
ENV TURBO_CONFIG=turbo.vps.json

# Build command becomes
RUN pnpm exec turbo build --config=turbo.vps.json
```

**Benefits**:
- ✅ Limits parallel builds inside each Docker image
- ✅ Reduces memory consumption per build
- ✅ More predictable resource usage

---

## ✅ Solution 3: Use Docker BuildKit with Resource Limits (RECOMMENDED)

### Implementation
Add resource limits to Docker builds.

**Update**: `infra/hostinger/scripts/build-resource-limited.sh`

```bash
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

print_context
require_command docker
require_file "$ENV_FILE"
require_file "$COMPOSE_BASE"
require_file "$COMPOSE_PROD"

# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🚀 Starting resource-limited build"
echo "   Max 2 concurrent builds, 2GB memory per build"
echo ""

# Build with resource limits
compose build \
  --parallel 2 \
  --memory 2g \
  --pull

echo "✅ Build complete!"
```

**Benefits**:
- ✅ Limits to 2 simultaneous builds
- ✅ Each build limited to 2GB RAM
- ✅ Uses BuildKit caching (faster rebuilds)
- ✅ More predictable performance

---

## ✅ Solution 4: Incremental Builds (BEST FOR UPDATES)

### Implementation
Only rebuild services that changed.

**Create**: `infra/hostinger/scripts/build-incremental.sh`

```bash
#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

print_context

echo "🔍 Detecting changed services..."

# Get list of changed files from git
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

# Function to check if service needs rebuild
needs_rebuild() {
  service=$1
  pattern=$2
  
  if echo "$CHANGED_FILES" | grep -q "$pattern"; then
    return 0  # true
  else
    return 1  # false
  fi
}

# Build only changed services
SERVICES_TO_BUILD=""

if needs_rebuild "api-server" "apps/api-server\|packages/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD api-server"
fi

if needs_rebuild "realtutorialhub-web" "apps/realtutorialhub-web\|packages/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD realtutorialhub-web"
fi

if needs_rebuild "skillup-web" "apps/skillup-web\|packages/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD skillup-web"
fi

# Add other services...

if [ -z "$SERVICES_TO_BUILD" ]; then
  echo "✅ No services need rebuilding"
  exit 0
fi

echo "📦 Building changed services: $SERVICES_TO_BUILD"
compose build $SERVICES_TO_BUILD

echo "✅ Incremental build complete!"
```

**Benefits**:
- ✅ Only builds what changed
- ✅ Much faster for code updates
- ✅ Minimal resource usage
- ✅ Perfect for frequent deploys

---

## ✅ Solution 5: Use Pre-built Images from CI/CD (BEST LONG-TERM)

### Implementation
Build images in GitHub Actions (unlimited resources), push to registry, pull on VPS.

**Create**: `.github/workflows/build-images.yml`

```yaml
name: Build Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - api-server
          - realtutorialhub-web
          - realtutorialhub-quiz
          - realtutorialhub-admin
          - skillup-web
          - skillup-admin
          - faculty-app
          - skillhubcore-admin
          - skillhub-placement
          - skillhubcore-service

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/${{ matrix.service }}/Dockerfile
          push: true
          tags: yourorg/quiz-platform-${{ matrix.service }}:latest
          cache-from: type=registry,ref=yourorg/quiz-platform-${{ matrix.service }}:buildcache
          cache-to: type=registry,ref=yourorg/quiz-platform-${{ matrix.service }}:buildcache,mode=max
```

**Update docker-compose.yml** on VPS:
```yaml
services:
  api-server:
    image: yourorg/quiz-platform-api-server:latest
    # Remove build: section
```

**On VPS, just pull**:
```bash
docker compose pull
docker compose up -d
```

**Benefits**:
- ✅ **ZERO CPU load** on VPS during build
- ✅ Builds happen on GitHub's powerful servers
- ✅ Much faster deployments (just pull pre-built images)
- ✅ Automatic caching in GitHub
- ✅ Best practice for production

---

## 📊 Solution Comparison

| Solution | CPU Impact | Implementation | Speed | Best For |
|----------|-----------|----------------|-------|----------|
| **Batched builds** | 🟡 Medium (50%) | ⭐ Easy | 🟡 Medium | Quick fix |
| **Lower concurrency** | 🟢 Low (30%) | ⭐⭐ Medium | 🟡 Medium | Tuning |
| **Resource limits** | 🟢 Low (40%) | ⭐⭐ Medium | 🟢 Fast | Control |
| **Incremental builds** | 🟢 Very Low | ⭐⭐⭐ Complex | 🟢 Very Fast | Updates |
| **CI/CD pre-built** | 🟢 **ZERO** | ⭐⭐⭐⭐ Complex | 🟢 **Fastest** | Production |

---

## 🎯 Recommended Implementation Plan

### Phase 1: Immediate Fix (Today)
✅ **Use Solution 1: Batched Builds**
- Create `build-optimized.sh`
- Use it for next deployment
- CPU load drops immediately

### Phase 2: Short-term (This Week)
✅ **Add Solution 3: Resource Limits**
- Update build script with `--parallel 2 --memory 2g`
- More predictable resource usage

### Phase 3: Medium-term (This Month)
✅ **Implement Solution 4: Incremental Builds**
- Only rebuild changed services
- Faster day-to-day deployments

### Phase 4: Long-term (Next Sprint)
✅ **Setup Solution 5: CI/CD Pipeline**
- Build on GitHub Actions
- Pull pre-built images on VPS
- Zero VPS build load
- Industry best practice

---

## 🚨 Emergency: If Server Freezes During Build

### Quick Recovery
```bash
# SSH to VPS
ssh hostinger-quiz-platform-root

# Stop all containers
docker compose down

# Kill any stuck build processes
docker ps -a | grep -i build | awk '{print $1}' | xargs docker rm -f

# Clear build cache (frees space)
docker builder prune -af

# Restart with optimized build
./infra/hostinger/scripts/build-optimized.sh
```

---

## 📋 VPS Resource Recommendations

### Current VPS Specs (Estimated from Graph)
- **CPU**: 2-4 cores
- **RAM**: 4-8 GB
- **Issue**: Building 10 services simultaneously overwhelms resources

### Option A: Optimize Builds (Free)
- Use batched/incremental builds
- Limit concurrency
- **Saves**: $0/month

### Option B: Upgrade VPS ($)
- **Recommended**: 8 GB RAM, 4 CPU cores
- **Cost**: ~$20-40/month more
- **Benefit**: Can handle parallel builds

### Option C: Move Builds to CI/CD (Best)
- Build on GitHub Actions (free for public repos)
- VPS just pulls images
- **Saves**: VPS resources + faster deploys

---

## 🎯 Specific Answer to Your Question

### Why `build.sh` Creates High CPU Load

1. **10 services build simultaneously** → 10× CPU usage
2. **Each service runs**:
   - TypeScript compilation
   - Next.js build (Webpack)
   - Turbo with concurrency=20
3. **No resource limits** → Docker uses ALL available CPU
4. **No caching** → Rebuilds everything every time

### How to Resolve

**Immediate Solution** (Use this first):
```bash
# Use batched build script
./infra/hostinger/scripts/build-optimized.sh
```

**Long-term Solution** (Implement over next 2 weeks):
1. Setup GitHub Actions to build images
2. Push to Docker Hub
3. VPS just pulls and runs
4. Zero build load on VPS

---

## 🚀 Ready to Implement?

I can help you:

1. ✅ Create `build-optimized.sh` (batched builds) - **5 minutes**
2. ✅ Create `build-resource-limited.sh` (with limits) - **5 minutes**
3. ✅ Create `build-incremental.sh` (smart rebuilds) - **15 minutes**
4. ✅ Setup GitHub Actions workflow (CI/CD) - **30 minutes**

**Which solution would you like to implement first?**

My recommendation: Start with Solution 1 (batched builds) RIGHT NOW, then plan Solution 5 (CI/CD) for next sprint.
