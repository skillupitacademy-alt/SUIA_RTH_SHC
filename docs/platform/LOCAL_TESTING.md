# Local Testing Guide

## Quick Start

### 1. Start the API Server
```bash
cd apps/api-server
pnpm dev
```
The API will run at `http://localhost:3000`

### 2. Start the Web App (New Terminal)
```bash
cd apps/web-app
pnpm dev
```
The web app will run at `http://localhost:3001`

### 3. Update Environment Variables

Create `apps/web-app/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Test the Flow

1. Go to `http://localhost:3001`
2. Login with: `user@test.com` / `password123`
3. Click "Start New Exam"
4. Select "Web Development"
5. Click "Start Enterprise Exam"
6. ✅ Should successfully create an exam!

## What's Been Fixed

- ✅ CORS headers working
- ✅ CSRF token validation
- ✅ All transactions removed (Neon compatible)
- ✅ Domain-to-blueprint mapping
- ✅ TypeScript compiling

## Production Deployment

Once Vercel's rate limit resets (midnight UTC / 5:30 AM IST), the latest code will auto-deploy.
