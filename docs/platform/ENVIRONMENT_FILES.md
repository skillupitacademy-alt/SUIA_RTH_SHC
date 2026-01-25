# Environment Files Configuration

## Overview
All apps in the monorepo use consistent environment configuration for local development.

## Configuration

### API Server (`apps/api-server`)
**Port**: 3000

**`.env`** (Build-time secrets):
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `ADMIN_JWT_SECRET` - Admin JWT secret
- `DATABASE_URL` - Database connection (placeholder for build)
- `NEXT_PUBLIC_API_URL` - API URL (http://localhost:3000/api)

**`.env.local`** (Runtime secrets - NOT committed):
- `DATABASE_URL` - Real Neon database URL
- `JWT_SECRET` - Real JWT secret
- `CSRF_SECRET` - CSRF token secret
- `NODE_ENV` - development

### Web App (`apps/web-app`)
**Port**: 3001

**`.env.local`** (NOT committed):
- `NEXT_PUBLIC_API_URL=http://localhost:3000/api`

### Admin App (`apps/admin-app`)
**Port**: 3002

**`.env`**:
- `NEXT_PUBLIC_API_URL=http://localhost:3000/api`

## Local Development URLs

| App | Local URL | API URL |
|-----|-----------|---------|
| API Server | http://localhost:3000 | - |
| Web App | http://localhost:3001 | http://localhost:3000/api |
| Admin App | http://localhost:3002 | http://localhost:3000/api |

## Production (Vercel)

All apps use Vercel environment variables:
- `NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com`
- Database and secrets configured in Vercel dashboard

## File Precedence

Next.js loads environment files in this order (later overrides earlier):
1. `.env` - Committed, shared across all environments
2. `.env.local` - NOT committed, local overrides
3. `.env.production` - Production-specific (if needed)
4. Vercel Environment Variables - Highest priority in production

## Best Practices

✅ **DO**:
- Use `.env.local` for local development secrets
- Keep `.env` for build-time placeholders
- Set production secrets in Vercel dashboard

❌ **DON'T**:
- Commit `.env.local` to git
- Put real secrets in `.env`
- Hardcode URLs in code
