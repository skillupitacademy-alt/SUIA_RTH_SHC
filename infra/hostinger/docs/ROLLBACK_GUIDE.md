# 🔄 Rollback Guide

## ⚠️ Important: How Rollback Works

Your deployment workflow is:
```
Windows PC (Local Git)
    ↓
Codex copies project
    ↓
VPS builds & runs
```

**The VPS is NOT the source of truth for Git.**

Therefore, rollback should NOT use `git checkout` on the VPS.

---

## ✅ Safe Rollback Method: Docker Images

Docker automatically keeps previous images when you rebuild.

### How It Works

```
Build new image → api-server:latest (NEW)
                   ↓
Old image becomes → <none> (PREVIOUS)
```

### Rollback Steps

```bash
# 1. List recent images
docker images | grep api-server

# 2. Find the previous image ID
PREVIOUS_IMAGE=<hash>

# 3. Tag it as latest
docker tag $PREVIOUS_IMAGE api-server:latest

# 4. Restart the service
docker compose up -d --no-deps api-server

# 5. Verify health
docker compose ps api-server
```

---

## 🚀 Quick Rollback (One Liner)

If you know the previous image:

```bash
# Example: Rollback api-server
docker tag $(docker images api-server -q | sed -n '2p') api-server:latest
docker compose up -d --no-deps api-server
```

---

## 📋 Rollback Checklist

1. **Identify Failed Service**
   ```bash
   docker compose ps
   ```

2. **Find Previous Image**
   ```bash
   docker images | grep <service-name>
   ```

3. **Tag Previous as Latest**
   ```bash
   docker tag <previous-hash> <service>:latest
   ```

4. **Restart Service**
   ```bash
   docker compose up -d --no-deps <service>
   ```

5. **Verify**
   ```bash
   docker compose logs -f <service>
   docker compose ps <service>
   ```

---

## 🎯 Recommended Approach

### Use Image Tags

Instead of relying on `<none>` images, use version tags:

```yaml
# docker-compose.yml
services:
  api-server:
    image: api-server:v${VERSION}
```

Then during build:

```bash
# Build with version tag
VERSION=$(date +%Y%m%d-%H%M%S)
docker build -t api-server:v$VERSION .
docker tag api-server:v$VERSION api-server:latest
```

Rollback becomes:

```bash
# List versions
docker images api-server

# Rollback to specific version
docker tag api-server:v20260706-103000 api-server:latest
docker compose up -d --no-deps api-server
```

---

## ❌ What NOT to Do

### Don't Use Git Checkout on VPS

```bash
# ❌ DON'T DO THIS
git checkout PREVIOUS_COMMIT
./deploy-production.sh
```

**Why it fails:**
- VPS might have uncommitted changes
- Codex might have synced a different version
- Git history might be incomplete
- Creates inconsistency with your Windows Git

---

## 🔮 Future: Automated Rollback

Phase 3 will add:

```bash
# Automatic rollback script
./deploy-rollback.sh api-server

# What it will do:
# 1. Find previous healthy deployment
# 2. Tag previous images
# 3. Restart services
# 4. Verify health
# 5. Restore deployment state
```

---

## 📝 Manual Rollback Example

### Scenario: api-server deployment failed

```bash
# Step 1: See what images exist
docker images | grep api-server

# Output:
# api-server   latest   abc123   2 minutes ago
# api-server   <none>   def456   1 hour ago     ← This is previous

# Step 2: Get previous image ID
PREV=$(docker images api-server -q | sed -n '2p')

# Step 3: Tag as latest
docker tag $PREV api-server:latest

# Step 4: Restart
docker compose up -d --no-deps api-server

# Step 5: Check
docker compose ps api-server
docker compose logs -f api-server
```

---

## 🎯 Summary

| Method | Safe? | Why |
|--------|-------|-----|
| **Docker image rollback** | ✅ YES | Uses Docker's built-in versioning |
| **Git checkout on VPS** | ❌ NO | VPS is not Git source of truth |
| **Redeploy from Windows** | ✅ YES | Codex syncs correct version |

**Recommended**: Use Docker image-based rollback until automated rollback is implemented.
