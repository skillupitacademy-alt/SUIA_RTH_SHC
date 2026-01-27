# Project-Specific Instructions for Quiz Platform

## 📁 Documentation Governance & Placement

### Global Documentation Placement Rule (MANDATORY)
- Every new `.md` file MUST be placed inside a folder whose name semantically matches its purpose.
- If no matching folder exists, the agent MUST create a new folder with a meaningful name.
- `.md` files MUST NOT be placed at the root of `docs/`.
- Page-specific contracts MUST always live under `docs/pages/<journey>/`.
- Global rules MUST live in a shared domain folder (e.g., `ux/`, `architecture/`, `platform/`).

**Violation of this rule requires the agent to STOP and ASK the user.**

### Folder Intent Guide:
- **`docs/ux/`**: Global UX rules and baselines (e.g., `UX_BASELINE.md`).
- **`docs/pages/`**: Page-specific contracts grouped by user journey.
- **`docs/execution/`**: Task logs, history, and status mapping.
- **`docs/architecture/`**: System design, specs, and project instructions.
- **`docs/platform/`**: CI/CD, environment config, and troubleshooting.
- **`docs/security/`**: Auth protocols and security hardening data.
- **`docs/domain/`**: Product modeling and business logic specs.
- **`docs/audits/`**: Project reports and quality audits.
- **`docs/walkthroughs/`**: Feature demonstrations and verification logs.
- **`docs/sql/`**: SQL migration scripts and schemas.

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

## Environment Detection

The `api-client` package automatically detects the environment (optimized for Production/Vercel):
- **Vercel Preview**: Auto-constructs preview URLs for branch testing.
- **Production**: Uses `https://api.realtutorialhub.com` as the authoritative backend.

No manual environment variable changes are needed for base operation!

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

## 📝 Change Log

### 2026-01-27
- **Production Hardening**: Removed all `localhost` references and local port (3000/3001/3002) development instructions.
- **Environment Detection**: Updated `api-client` to strictly prioritize production and preview logic.
- **Security**: CSRF and Auth protocols hardened for strict production execution.

**Last Updated**: 2026-01-27
