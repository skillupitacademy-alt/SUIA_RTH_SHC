- **Validation**: Real DB writes, Real Auth sessions, No mock data.

---

## 3. Operations Log: Vercel API Fix
*Source: Fix Vercel API Connection.md*

### Issue
- **Error**: `ERR_CONNECTION_REFUSED` on `localhost:3001`.
- **Cause**: API server not running or port conflict.

### Resolution
- **Environment**: Created `.env.local` for web and api.
- **Commands**: running `pnpm dev` starts all apps (3000, 3001, 3002).
- **FavIcon**: Fixed 404.
- **Validation**: `/api/status` returns JSON.

