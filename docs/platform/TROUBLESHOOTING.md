# 🔧 API Connection Error - Troubleshooting Guide

## Error Summary

**Error**: `localhost:3001/api/auth/signup:1 Failed to load resource: net::ERR_CONNECTION_REFUSED`

**Cause**: The API server (running on port 3001) is not running, so the web app (port 3000) cannot connect to it.

---

## ✅ Solution Steps

### Step 1: Environment Files Created

I've created the necessary environment files:

1. ✅ `apps/web-app/.env.local` - Web app configuration
2. ✅ `apps/api-server/.env.local` - API server configuration

### Step 2: Start All Servers

You need to run **both** the web app and API server. Here are your options:

#### Option A: Start All Apps with Turbo (Recommended)

Open a terminal in the project root and run:

```bash
cd d:\onlinewebsites\quiz-platform
pnpm dev
```

This will start:
- ✅ Web app on `http://localhost:3000`
- ✅ API server on `http://localhost:3001`
- ✅ Admin app on `http://localhost:3002`

#### Option B: Start Servers Individually

If you want to run them separately:

**Terminal 1 - API Server**:
```bash
cd d:\onlinewebsites\quiz-platform\apps\api-server
pnpm dev
```

**Terminal 2 - Web App**:
```bash
cd d:\onlinewebsites\quiz-platform\apps\web-app
pnpm dev
```

**Terminal 3 - Admin App** (optional):
```bash
cd d:\onlinewebsites\quiz-platform\apps\admin-app
pnpm dev
```

---

## 🔍 Verification

After starting the servers, verify they're running:

### Check API Server
Open browser to: `http://localhost:3001/api/status`

You should see a JSON response like:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Check Web App
Open browser to: `http://localhost:3000`

You should see the landing page.

### Check Signup
Go to: `http://localhost:3000/signup`

The signup form should load without errors.

---

## 🐛 Other Issues Fixed

### 1. Favicon 404 Error

**Error**: `favicon.ico:1 Failed to load resource: the server responded with a status of 404`

**Fix**: Add a favicon to your web app.

Create: `apps/web-app/public/favicon.ico`

Or add this to `apps/web-app/src/app/layout.tsx`:

```tsx
export const metadata = {
  icons: {
    icon: '/favicon.ico',
  },
}
```

### 2. Feature Collector Warning

**Warning**: `feature_collector.js:23 using deprecated parameters`

This is a third-party library warning (likely from analytics or monitoring). It's non-critical and won't affect functionality.

---

## 📋 Environment Configuration

### Web App (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**For Production (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api
```

### API Server (.env.local)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CSRF_SECRET=...
NODE_ENV=development
```

---

## 🚀 Quick Start Commands

### Development (Local)

```bash
# From project root
cd d:\onlinewebsites\quiz-platform

# Install dependencies (if not done)
pnpm install

# Start all apps
pnpm dev
```

### Production Build

```bash
# Build all apps
pnpm build

# Start production servers
pnpm start
```

---

## 🔧 Troubleshooting Checklist

If you still have issues, check:

- [ ] API server is running on port 3001
- [ ] Web app is running on port 3000
- [ ] `.env.local` files exist in both apps
- [ ] Database connection is working
- [ ] No other process is using ports 3000 or 3001
- [ ] Node.js version is 20.x
- [ ] pnpm version is 9.15.4

### Check Running Processes

```powershell
# Check what's running on port 3000
netstat -ano | findstr :3000

# Check what's running on port 3001
netstat -ano | findstr :3001
```

### Kill Process on Port (if needed)

```powershell
# Find process ID
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

## 📊 Expected Server Ports

| App | Port | URL |
|-----|------|-----|
| Web App | 3000 | http://localhost:3000 |
| API Server | 3001 | http://localhost:3001 |
| Admin App | 3002 | http://localhost:3002 |

---

## 🎯 Next Steps

1. **Start the servers** using `pnpm dev`
2. **Verify API is running** at `http://localhost:3001/api/status`
3. **Test signup** at `http://localhost:3000/signup`
4. **Check browser console** for any remaining errors

---

## 💡 Production Deployment

For production on Vercel:

1. **Web App** environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api
   ```

2. **API Server** environment variables:
   ```
   DATABASE_URL=<your-neon-db-url>
   JWT_SECRET=<your-jwt-secret>
   JWT_REFRESH_SECRET=<your-refresh-secret>
   CSRF_SECRET=<your-csrf-secret>
   NODE_ENV=production
   ```

3. **Deploy each app separately** to Vercel:
   - quiz.realtutorialhub.com → web-app
   - api.realtutorialhub.com → api-server
   - admin.realtutorialhub.com → admin-app

---

## 📞 Still Having Issues?

If you're still experiencing problems:

1. Check the terminal output for error messages
2. Check browser console for detailed errors
3. Verify database connection
4. Ensure all environment variables are set correctly

---

**Created**: 2026-01-24  
**Status**: Ready to start servers
