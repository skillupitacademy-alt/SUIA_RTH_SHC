# Local Testing Guide (DEPRECATED)

> [!WARNING]
> This guide is deprecated. The platform has been hardened for **Production/Vercel-only** execution. Local `localhost` ports are no longer supported in environment detection or security middleware.

## Recommended Testing Workflow

### 1. Vercel Preview
- Deploy changes to a branch.
- Vercel will generate a preview URL.
- The `api-client` will automatically link the `web-app` and `api-server` preview subdomains.

### 2. Remote Database
- All testing now uses the **Neon PostgreSQL** production/staging database.
- Ensure your local `.env.local` uses the Neon `DATABASE_URL`.

## What's Been Hardened

- ✅ CORS headers: Strictly enforced for `realtutorialhub.com`.
- ✅ CSRF Protection: No more `localhost` bypasses.
- ✅ URL Detection: Environment-aware but legacy-localhost-free.

## 📝 Change Log

### 2026-01-27
- **Deprecated Localhost**: Removed instructions for starting local servers on 3000/3001/3002.
- **Production Alignment**: Redirected all testing efforts toward Vercel Preview environments.
