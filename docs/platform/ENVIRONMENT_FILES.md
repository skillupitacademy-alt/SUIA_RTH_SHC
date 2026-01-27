## Configuration

### API Server (`apps/api-server`)

**`.env`** (Build-time seeds):
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `ADMIN_JWT_SECRET` - Admin JWT secret
- `DATABASE_URL` - Database connection
- `NEXT_PUBLIC_API_URL` - `https://api.realtutorialhub.com/api`

### Web App (`apps/web-app`)

**`.env.local`** (NOT committed):
- `NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api`

### Admin App (`apps/admin-app`)

**`.env`**:
- `NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api`

## Production (Vercel)

All apps use Vercel environment variables:
- `NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api`
- `NEXT_PUBLIC_ADMIN_URL=https://admin.realtutorialhub.com`
- Database and secrets configured in Vercel dashboard

## File Precedence

Next.js loads environment files in this order (later overrides earlier):
1. `.env` - Committed, shared across all environments
2. `.env.local` - NOT committed, local overrides
3. `.env.production` - Production-specific (if needed)
4. Vercel Environment Variables - Highest priority in production

## Best Practices

✅ **DO**:
- Use `.env.local` for local development secrets (Neon connection)
- Keep `.env` for build-time placeholders
- Set production secrets in Vercel dashboard

❌ **DON'T**:
- Commit `.env.local` to git
- Put real secrets in `.env`
- Hardcode URLs in code

## 📝 Change Log

### 2026-01-27
- **Cleanup**: Purged all `localhost:3000/3001/3002` references.
- **Alignment**: Standardized all `.env` templates to use `realtutorialhub.com` production domains.
