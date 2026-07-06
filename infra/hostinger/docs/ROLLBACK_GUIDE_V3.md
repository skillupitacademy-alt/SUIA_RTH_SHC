# Rollback Guide V3.0

**Docker Image-Based Rollback with Automated Script**

Phase 5 Complete - Safe, interactive rollback system.

## Quick Start

```bash
cd /opt/platform/apps/quiz-platform/infra/hostinger/scripts
./rollback-deployment.sh
```

Follow the interactive prompts to select and rollback to a previous deployment.

## What Changed in V3

✅ **Automatic rollback script** - Interactive, safe  
✅ **Deployment tagging** - Every build tagged with timestamp  
✅ **Image versioning** - Keep last 3 versions per service  
✅ **Health validation** - Automatic checks after rollback  
✅ **State tracking** - Rollback recorded in history  

❌ **No Git-based rollback** - VPS is not Git source of truth  
❌ **No manual steps** - Script handles everything  

## How It Works

### Every Deployment

1. Builds services → Creates `:latest` images
2. Tags with `deployment-YYYYMMDD-HHMMSS`
3. Keeps last 3 tagged versions
4. Saves deployment state to history

### Rollback Process

1. Lists last 10 deployments
2. User selects target
3. Finds previous Docker images
4. Tags as `:latest`
5. Restarts services
6. Validates health
7. Runs smoke tests
8. Updates state

## Using the Rollback Script

```bash
./rollback-deployment.sh
```

### Interactive Example

```
Available rollback targets:

  1) abc1234 @ 2026-07-06T15:30:00Z (CURRENT)
  2) def5678 @ 2026-07-06T14:20:00Z
  3) ghi9012 @ 2026-07-06T13:10:00Z

Select rollback target (1-10, or 'q' to quit): 2
```

Script will:
- Show target details
- Confirm rollback
- Find Docker images
- Perform rollback
- Validate health
- Update state

## Safety Features

✅ **Confirmation prompts** - No accidental rollbacks  
✅ **Image validation** - Checks exist before proceeding  
✅ **Health checks** - Ensures services start  
✅ **Smoke tests** - Validates endpoints  
✅ **Partial rollback handling** - Continues if some images missing  
✅ **Lock management** - Prevents concurrent operations  

## Limitations

**Image retention**: Only last 3 deployments kept per service  
**Build requirement**: Can only rollback services that were built  
**jq required**: Must have jq installed for rollback  

## Manual Rollback (If Script Unavailable)

```bash
# 1. Find previous image
docker images api-server

# 2. Tag as latest (using second image ID)
PREV=$(docker images api-server -q | sed -n '2p')
docker tag $PREV api-server:latest

# 3. Restart
cd /opt/platform/apps/quiz-platform/infra/hostinger/compose
docker compose up -d --no-deps api-server

# 4. Verify
docker compose ps api-server
docker compose logs -f api-server
```

## After Rollback

### Check Status

```bash
# View current deployment
cat /opt/platform/state/deployment.json

# Check it's marked as rollback
jq '.is_rollback' /opt/platform/state/deployment.json
```

### Move Forward

To deploy current code again:

```bash
./deploy-production.sh
```

## Troubleshooting

### "jq not found"

```bash
# Install jq
apt-get install jq
```

### "No previous image found"

Service wasn't built in recent deployments. Use different target or re-deploy.

### "Lock file exists"

Another operation running or stale lock:

```bash
# Check process
ps aux | grep deploy

# Remove if stale
rm /opt/platform/state/deploy.lock
```

### "Health checks failed"

Previous version has issues. Options:
- Accept anyway (script prompts)
- Cancel and try different target
- Investigate logs first

## Best Practices

1. **Use automatic script** - Safer than manual
2. **Test after rollback** - Verify functionality
3. **Document reason** - Why was rollback needed
4. **Fix root cause** - Rollback is temporary
5. **Monitor metrics** - Ensure issue resolved

## Architecture Decision

**Why Docker images not Git?**

- VPS is not Git source of truth
- Codex syncs local → VPS
- Git checkout breaks workflow
- Docker images are deployment artifacts
- Images include built state, not just source

See `ARCHITECTURE_DECISIONS.md` for full rationale.

## Files Created

- `rollback-deployment.sh` - Automated rollback script
- `ROLLBACK_GUIDE_V3.md` - This guide
- Updated `lib-deployment.sh` - Image tagging functions
- Updated `deploy-production.sh` - Tags images on build

## Version History

- **V3.0** - Automatic script with tagging
- **V2.0** - Manual Docker image method
- **V1.0** - Git-based (removed, unsafe)
