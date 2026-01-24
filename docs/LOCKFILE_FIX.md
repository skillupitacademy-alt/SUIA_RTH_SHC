# 🔧 Quick Fix for Lockfile Issue

Since Node.js 20.x is not installed locally, we need to fix this in Vercel settings.

## Solution: Update Vercel Build Settings

1. Go to **quiz-platform-api-server** project in Vercel
2. Go to **Settings** → **Build & Development Settings**
3. Find **Install Command**
4. Change from: `pnpm install`
5. Change to: `pnpm install --no-frozen-lockfile`
6. Click **Save**
7. **Redeploy**

This will allow Vercel to regenerate the lockfile during build.

## Alternative: If you have Node.js 20.x installed elsewhere

Run these commands:
```bash
cd d:\onlinewebsites\quiz-platform
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
git push origin main
```

Then revert the install command back to `pnpm install` in Vercel.
