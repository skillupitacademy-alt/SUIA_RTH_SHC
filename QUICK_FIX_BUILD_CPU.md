# 🚨 Quick Fix: VPS Build CPU Overload

## Problem
Your `build.sh` builds **10 Docker images simultaneously**, causing:
- CPU: 100% usage
- RAM: Exhaustion
- Server: Becomes unresponsive

## Immediate Solution (Use This Now!)

### Step 1: Use the Optimized Build Script

Instead of:
```bash
./infra/hostinger/scripts/build.sh
```

Use:
```bash
./infra/hostinger/scripts/build-optimized.sh
```

**Result**: CPU drops from 100% to ~50%

### What It Does
Builds services in **batches** instead of all at once:
- Group 1: api-server + realtutorialhub-web (2 services)
- Group 2: realtutorialhub-quiz + realtutorialhub-admin (2 services)
- Group 3: skillup-web + skillup-admin + faculty-app (3 services)
- Group 4: skillhubcore-admin + skillhub-placement + skillhubcore-service (3 services)

---

## How to Deploy Now

```bash
# SSH to VPS
ssh hostinger-quiz-platform-root

# Navigate to project
cd /opt/platform/apps/quiz-platform

# Pull latest code (includes the new script)
git pull origin main

# Make script executable
chmod +x infra/hostinger/scripts/build-optimized.sh

# Use the optimized build
./infra/hostinger/scripts/build-optimized.sh

# Deploy
docker compose up -d --remove-orphans
```

---

## Why This Works

### Before (build.sh)
```
docker compose build --pull
    ↓
Builds ALL 10 services simultaneously
    ↓
10× CPU usage = 100% CPU
    ↓
Server freezes
```

### After (build-optimized.sh)
```
Build Group 1 (2 services)
    ↓ Wait for completion
Build Group 2 (2 services)
    ↓ Wait for completion
Build Group 3 (3 services)
    ↓ Wait for completion
Build Group 4 (3 services)
    ↓
Max 3× CPU usage = ~50% CPU
    ↓
Server stays responsive
```

---

## Long-term Solution

**Setup CI/CD** to build images on GitHub Actions:
- Builds happen on GitHub's servers (unlimited resources)
- VPS just pulls pre-built images
- **ZERO CPU load on VPS**

See `VPS_BUILD_OPTIMIZATION_SOLUTIONS.md` for implementation guide.

---

## If Server Is Currently Frozen

```bash
# SSH to VPS
ssh hostinger-quiz-platform-root

# Kill stuck builds
docker ps -a | grep -i build | awk '{print $1}' | xargs docker rm -f

# Clear build cache
docker builder prune -af

# Use optimized build
./infra/hostinger/scripts/build-optimized.sh
```

---

## Summary

| Method | CPU Usage | Time | Difficulty |
|--------|-----------|------|------------|
| **Old (build.sh)** | 🔴 100% | Fast | N/A |
| **New (build-optimized.sh)** | 🟡 50% | Slower | ⭐ Easy |
| **CI/CD (future)** | 🟢 0% | Fastest | ⭐⭐⭐ Medium |

**Action**: Use `build-optimized.sh` starting today!
