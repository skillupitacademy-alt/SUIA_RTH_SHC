# Project-Specific Instructions for Quiz Platform

## 📁 Documentation Location

**All documentation files (.md) must be placed in the `docs/` folder.**

- ✅ Correct: `docs/ENVIRONMENT_CONFIG.md`
- ❌ Wrong: `ENVIRONMENT_CONFIG.md` (root level)

## ⚠️ CRITICAL: Git Push Policy

**DO NOT push to GitHub automatically during local development/testing!**

### Rules:
1. **Local changes** should be committed locally but **NOT pushed** to GitHub
2. **Only push to GitHub** when explicitly instructed by the user
3. **Reason**: Every GitHub push triggers Vercel auto-deployment, which counts against the daily deployment limit (100/day on free tier)

### Workflow:

#### ✅ Allowed (Local Testing):
```bash
# Make changes
git add .
git commit -m "fix: some change"
# STOP HERE - Do not push!
```

#### ❌ Not Allowed (Unless User Requests):
```bash
git push origin main  # Only when user explicitly asks!
```

#### ✅ When User Says "Deploy" or "Push to GitHub":
```bash
git push origin main  # Now it's okay
```

## Development Setup

### Local Testing Ports:
- **API Server**: Port 3000 (`apps/api-server`)
- **Web App**: Port 3001 (override with `pnpm dev -- -p 3001`)
- **Admin App**: Port 3002 (override with `pnpm dev -- -p 3002`)

### Running Locally:
```bash
# Terminal 1 - API Server
cd apps/api-server
pnpm dev

# Terminal 2 - Web App
cd apps/web-app
pnpm dev -- -p 3001
```

## Environment Detection

The `api-client` package automatically detects the environment:
- **Localhost**: Uses `http://localhost:3000`
- **Vercel Preview**: Auto-constructs preview URL
- **Production**: Uses `https://api.realtutorialhub.com`

No manual environment variable changes needed!

## Database

- **Provider**: Neon (PostgreSQL)
- **Connection**: HTTP driver (no transactions supported)
- **Sample Data**: `packages/db/sample-data.sql` and `packages/db/test-users.sql`

## Test Credentials

- Email: `ajayshah@gmail.com`
- Password: `123`

## Vercel Deployment Limit

- **Free Tier**: 100 deployments/day
- **Resets**: Midnight UTC (5:30 AM IST)
- **Current Status**: Monitor in Vercel dashboard

---

**Last Updated**: 2026-01-25
