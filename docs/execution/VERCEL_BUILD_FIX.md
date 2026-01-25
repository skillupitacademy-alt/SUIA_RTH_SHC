# Vercel Build Fix - Final Solution

## The Problem

The lockfile (`pnpm-lock.yaml`) doesn't include the TypeScript types we moved to dependencies because we can't regenerate it locally (no Node.js 20.x installed).

## The Solution

Update Vercel's **Install Command** to force install the types:

### Step 1: Update Install Command in Vercel

1. Go to: https://vercel.com/dashboard
2. Select: **quiz-platform-api-server**
3. Go to: **Settings** → **Build & Development Settings**
4. Find: **Install Command**
5. Change to:
   ```bash
   pnpm install --no-frozen-lockfile && cd apps/api-server && pnpm add @types/jsonwebtoken @types/bcrypt @types/node
   ```
6. Make sure **Override** toggle is **ON** (blue)
7. Click **Save**

### Step 2: Deploy

1. Go to **Deployments** tab
2. Click **Deploy** (not Redeploy)
3. Select **Branch**: main
4. Click **Deploy**

This will:
- Install all packages with the old lockfile
- Then explicitly install the TypeScript types in the api-server
- TypeScript will compile successfully
- Build will succeed

## Alternative: Simpler Approach

Just use: `pnpm install --no-frozen-lockfile`

This regenerates the lockfile on Vercel's servers with Node 20.x.
