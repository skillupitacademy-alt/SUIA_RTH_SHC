# Phase 3 Cutover: Registry-Based Deployment

**Source-Free VPS Deployment Guide**

This guide walks through the complete cutover to registry-based deployment where the VPS no longer needs source code.

## Overview

**Current State:** VPS builds images from source code  
**Target State:** VPS pulls pre-built images from Docker registry  
**Benefit:** Faster deployments, no source code on VPS, better security

## Prerequisites

✅ Docker Hub or GHCR account  
✅ SSH access to VPS: `ssh hostinger-quiz-platform-root`  
✅ Local repository up to date  
✅ All Phase 1-5 commits (V3.0 framework)  

## Step-by-Step Cutover

### Step 1: Choose Registry and Configure

**Option A: Docker Hub (Recommended)**
```bash
# Registry prefix format
REGISTRY_PREFIX="docker.io/your-dockerhub-username"

# Login locally
docker login docker.io
```

**Option B: GitHub Container Registry**
```bash
# Registry prefix format
REGISTRY_PREFIX="ghcr.io/your-github-username"

# Login locally (requires GitHub Personal Access Token)
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
```

### Step 2: Build and Push Images (Local PC)

From your local repository:

```bash
cd d:\onlinewebsites\quiz-platform\infra\hostinger\scripts

# Set registry and tag
$Env:REGISTRY_PREFIX = "docker.io/your-username"
$Env:IMAGE_TAG = "20260706-001"

# Build and push all services
wsl bash build-push-images.sh
```

**What this does:**
- Builds all 10 services locally
- Tags with registry prefix and image tag
- Pushes to Docker registry
- Shows VPS deployment command

**Expected output:**
```
✓ Pushed docker.io/your-username/api-server:20260706-001
✓ Pushed docker.io/your-username/realtutorialhub-web:20260706-001
... (all 10 services)

Next VPS Command:
REGISTRY_PREFIX="docker.io/your-username" IMAGE_TAG="20260706-001" ./deploy-pull-production.sh
```

### Step 3: Package Runtime Bundle (Local PC)

Still from local repository:

```bash
cd d:\onlinewebsites\quiz-platform\infra\hostinger\scripts

# Package runtime files
wsl bash package-runtime-bundle.sh
```

**What this creates:**
```
infra/hostinger/dist/
├── hostinger-runtime-v3.2.0-abc12345-20260706-143000.tar.gz
└── hostinger-runtime-v3.2.0-abc12345-20260706-143000.tar.gz.sha256
```

**Bundle contains:**
- Docker Compose files (no build context)
- Deployment scripts
- Configuration files
- Nginx config
- **NO source code**

### Step 4: Upload Runtime Bundle to VPS

```bash
cd d:\onlinewebsites\quiz-platform\infra\hostinger\dist

# Copy bundle and checksum to VPS
scp hostinger-runtime-*.tar.gz* root@72.61.115.49:/opt/platform/releases/
```

### Step 5: SSH into VPS and Prepare Release

```bash
# SSH to VPS
ssh hostinger-quiz-platform-root

# Navigate to releases
cd /opt/platform/releases

# Verify checksum
sha256sum -c hostinger-runtime-*.sha256

# Extract bundle
tar -xzf hostinger-runtime-*.tar.gz

# List extracted directory
ls -la hostinger-runtime-v3.2.0-*
```

### Step 6: Backup Current Runtime (VPS)

**CRITICAL: Backup before replacing!**

```bash
# On VPS
cd /opt/platform

# Create backup of current runtime
tar -czf backups/platform-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  compose/ \
  config/ \
  scripts/ \
  nginx/ \
  --exclude=apps

# Verify backup
ls -lh backups/
```

### Step 7: Install Runtime Bundle (VPS)

```bash
# On VPS
cd /opt/platform/releases

# Copy runtime files to /opt/platform
cp -r hostinger-runtime-v3.2.0-*/compose/* /opt/platform/compose/
cp -r hostinger-runtime-v3.2.0-*/config/* /opt/platform/config/
cp -r hostinger-runtime-v3.2.0-*/scripts/* /opt/platform/scripts/
cp -r hostinger-runtime-v3.2.0-*/nginx/* /opt/platform/nginx/

# Make scripts executable
chmod +x /opt/platform/scripts/*.sh

# Verify installation
ls -la /opt/platform/scripts/deploy-pull-production.sh
ls -la /opt/platform/compose/docker-compose.yml
```

**Preserve existing:**
- `/opt/platform/env/` - Environment variables
- `/opt/platform/nginx/certs/` - SSL certificates
- `/opt/platform/state/` - Deployment state
- `/opt/platform/logs/` - Logs
- `/opt/platform/backups/` - Backups

### Step 8: Docker Login on VPS

```bash
# On VPS
docker login docker.io
# Enter username and password
```

### Step 9: Deploy from Registry (VPS)

```bash
# On VPS
cd /opt/platform/scripts

# Deploy by pulling images (NOT building)
REGISTRY_PREFIX="docker.io/your-username" \
IMAGE_TAG="20260706-001" \
./deploy-pull-production.sh
```

**What this does:**
1. Acquires deployment lock
2. Validates configuration
3. Pulls images from registry
4. Tags as :latest locally
5. Restarts services with `--no-build`
6. Runs health checks
7. Runs smoke tests
8. Saves deployment state

**Expected duration:** 2-3 minutes (much faster than building!)

### Step 10: Verify Production (VPS)

Test all brand URLs:

```bash
# On VPS
# Test RTH
curl -I https://user.realtutorialhub.com/login

# Test SkillUp
curl -I https://user.skillupitacademy.com/login

# Test SkillHub Core
curl -I https://admin.skillhubcore.in/login

# Check Docker status
docker compose ps

# Check logs
docker compose logs --tail=50

# Check health endpoints
docker exec quiz-platform-nginx-1 wget -qO- http://api-server:3000/api/health/live
```

**Manual verification:**
- ✅ Login pages load
- ✅ Authentication works
- ✅ Dashboard displays correctly
- ✅ No errors in logs

### Step 11: Move Source Code Aside (VPS)

**ONLY after successful verification!**

```bash
# On VPS
cd /opt/platform

# Move source code to backup location
mv apps/quiz-platform apps/quiz-platform.source-backup-$(date +%Y%m%d)

# Verify move
ls -la apps/
```

### Step 12: Verify Source-Free Deployment (VPS)

Deploy again without source code:

```bash
# On VPS
cd /opt/platform/scripts

# Deploy using only registry images
REGISTRY_PREFIX="docker.io/your-username" \
IMAGE_TAG="20260706-001" \
./deploy-pull-production.sh
```

**This should succeed!** If it does, VPS no longer needs source code.

### Step 13: Monitor for 3-7 Days

Keep source backup for safety:

```bash
# Check disk usage
df -h /opt/platform

# Monitor deployments
tail -f /opt/platform/logs/deploy.log

# Check deployment history
ls -lt /opt/platform/state/history/
```

### Step 14: Delete Source Backup (After 7 Days)

**Only after stable operation!**

```bash
# On VPS (after 7 days of stable operation)
rm -rf /opt/platform/apps/quiz-platform.source-backup-*

# Verify deletion
ls -la /opt/platform/apps/
```

## Final VPS Structure

After cutover, VPS contains only:

```
/opt/platform/
├── compose/                    ✅ Docker Compose files (no build context)
├── config/                     ✅ Deployment configuration
├── env/                        ✅ Environment variables
├── nginx/                      ✅ Nginx configuration
│   └── certs/                 ✅ SSL certificates
├── scripts/                    ✅ Deployment scripts
├── state/                      ✅ Deployment state
├── logs/                       ✅ Application logs
├── backups/                    ✅ Backups
└── releases/                   ✅ Runtime bundles

NO source code needed!
```

## Rollback Plan

If anything goes wrong:

### Rollback to Source-Based Deployment

```bash
# On VPS
cd /opt/platform

# Restore source code
mv apps/quiz-platform.source-backup-20260706 apps/quiz-platform

# Deploy using source-based method
cd apps/quiz-platform/infra/hostinger/scripts
./deploy-production.sh
```

### Restore Runtime Bundle

```bash
# On VPS
cd /opt/platform

# Extract backup
tar -xzf backups/platform-backup-20260706-*.tar.gz -C /

# Restart services
cd /opt/platform/apps/quiz-platform/infra/hostinger/compose
docker compose restart
```

## Troubleshooting

### "Cannot pull image"

**Issue:** Docker pull fails

**Fix:**
```bash
# Check Docker login
docker login docker.io

# Verify image exists
docker pull docker.io/your-username/api-server:20260706-001

# Check registry credentials
cat ~/.docker/config.json
```

### "Service unhealthy after deploy"

**Issue:** Health checks fail

**Fix:**
```bash
# Check logs
docker compose logs api-server

# Check health endpoint
docker exec quiz-platform-nginx-1 wget -qO- http://api-server:3000/api/health/live

# Rollback if needed
./rollback-deployment.sh
```

### "Missing environment variables"

**Issue:** Services fail to start

**Fix:**
```bash
# Verify env files exist
ls -la /opt/platform/env/

# Check Docker Compose sees env files
docker compose config | grep -A 5 env_file
```

## Next Deployment

After cutover, future deployments:

### 1. Build and Push (Local)

```bash
cd d:\onlinewebsites\quiz-platform\infra\hostinger\scripts

$Env:REGISTRY_PREFIX = "docker.io/your-username"
$Env:IMAGE_TAG = "20260706-002"

wsl bash build-push-images.sh
```

### 2. Deploy (VPS)

```bash
# SSH to VPS
ssh hostinger-quiz-platform-root

cd /opt/platform/scripts

REGISTRY_PREFIX="docker.io/your-username" \
IMAGE_TAG="20260706-002" \
./deploy-pull-production.sh
```

**That's it!** No source code sync, no builds on VPS.

## Benefits

✅ **Faster deployments:** No build time on VPS (2-3 min vs 10-15 min)  
✅ **Lower CPU usage:** No compilation on 2 vCPU server  
✅ **Better security:** No source code on VPS  
✅ **Consistent builds:** Same image in dev, staging, prod  
✅ **CI/CD ready:** Images built in pipeline  
✅ **Easier rollback:** Just change IMAGE_TAG  

## Verification Checklist

Before declaring success:

- [ ] Images pushed to registry successfully
- [ ] Runtime bundle extracted on VPS
- [ ] First registry deployment succeeded
- [ ] All health checks passed
- [ ] All smoke tests passed
- [ ] All brand URLs accessible
- [ ] Authentication works
- [ ] Dashboards load correctly
- [ ] Source code moved aside
- [ ] Second deployment (without source) succeeded
- [ ] No errors in logs
- [ ] Monitoring shows stability

## Support

If you encounter issues during cutover:

1. Check this guide's troubleshooting section
2. Review `/opt/platform/logs/`
3. Check deployment history: `/opt/platform/state/history/`
4. Rollback if needed (see Rollback Plan above)

## Conclusion

After successful cutover, your deployment workflow becomes:

**Local:** Build → Push to registry  
**VPS:** Pull from registry → Deploy  

No source code, no builds, faster and safer deployments!
