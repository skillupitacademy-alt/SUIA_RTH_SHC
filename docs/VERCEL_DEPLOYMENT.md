# 🚀 Production Deployment Guide - Vercel

## Current Issue

Your web app at `https://quiz.realtutorialhub.com` is trying to connect to `https://api.realtutorialhub.com/api` but the API server is either:
1. Not deployed yet, OR
2. Missing environment variables

---

## ✅ Solution: Deploy & Configure All 3 Apps

You need to deploy **3 separate Vercel projects**:

### 1. Web App (User Platform)
- **Domain**: `quiz.realtutorialhub.com`
- **Source**: `apps/web-app`
- **Status**: ✅ Deployed (currently live)

### 2. API Server (Backend)
- **Domain**: `api.realtutorialhub.com`
- **Source**: `apps/api-server`
- **Status**: ⚠️ **NEEDS DEPLOYMENT**

### 3. Admin App (Admin Platform)
- **Domain**: `admin.realtutorialhub.com`
- **Source**: `apps/admin-app`
- **Status**: ⚠️ Needs deployment

---

## 🔧 Step-by-Step Deployment

### Step 1: Deploy API Server (CRITICAL)

#### A. Create New Vercel Project

1. Go to: https://vercel.com/new
2. Select your GitHub repository: `realtutorialhub/quiz-platform`
3. Click **Add New Project**

#### B. Configure API Server Project

**Project Settings**:
- **Project Name**: `quiz-platform-api-server`
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/api-server` ⚠️ **IMPORTANT**
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **Output Directory**: `.next`
- **Node.js Version**: `20.x`

#### C. Add Environment Variables

Go to **Settings → Environment Variables** and add:

```env
DATABASE_URL=postgresql://quiz_admin:password@ep-xyz.neon.tech/quiz_platform_prod
DATABASE_POOL_URL=postgresql://quiz_admin:password@ep-xyz-pooler.neon.tech/quiz_platform_prod
DATABASE_DIRECT_URL=postgresql://quiz_admin:password@ep-xyz.neon.tech/quiz_platform_prod

JWT_SECRET=2aa2586018b2a294beaac1b09b041bf239f5f351cec977e9b8c9790eabb304262d621b0d0355f0147a01cfee94f173c24c12fd2372b062523d0da8fac40e2
JWT_REFRESH_SECRET=a5e1912581693e167925ff90f156f06fb25e859c632661071379829b7f185e1aa824aa36c3d1964fd03a02585f50db1fde2e00cbf2540b4d8600c8f1747520f1d
CSRF_SECRET=bed7e0f6924d3fb8fccfb551dc40e67c41504d546ac1d1ce55d076a66c0c6c33f723ffed2e5c8a89e27b9026ca0dd9bd1df4af36bbaa64560c4ad48cf70f2c077

NODE_ENV=production
```

⚠️ **IMPORTANT**: Replace the database URLs with your actual Neon PostgreSQL credentials!

#### D. Set Custom Domain

1. Go to **Settings → Domains**
2. Add domain: `api.realtutorialhub.com`
3. Configure DNS (see below)

#### E. Deploy

Click **Deploy** and wait for build to complete.

---

### Step 2: Update Web App Environment Variables

Your web app is already deployed, but needs the correct environment variable.

#### A. Go to Web App Project

1. Go to: https://vercel.com/dashboard
2. Select your `quiz-platform-web-app` project

#### B. Update Environment Variables

Go to **Settings → Environment Variables** and add/update:

```env
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api
```

#### C. Redeploy

1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**

---

### Step 3: Deploy Admin App (Optional)

Follow same steps as API Server but with:
- **Root Directory**: `apps/admin-app`
- **Domain**: `admin.realtutorialhub.com`

---

## 🌐 DNS Configuration

For each subdomain, add these DNS records in your domain registrar:

### api.realtutorialhub.com

```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

### admin.realtutorialhub.com

```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

---

## 📋 Vercel Project Configuration Summary

### Project 1: Web App

| Setting | Value |
|---------|-------|
| Name | quiz-platform-web-app |
| Domain | quiz.realtutorialhub.com |
| Root Directory | `apps/web-app` |
| Framework | Next.js |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Node Version | 20.x |
| **Environment Variables** | `NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api` |

### Project 2: API Server ⚠️ **NEEDS DEPLOYMENT**

| Setting | Value |
|---------|-------|
| Name | quiz-platform-api-server |
| Domain | api.realtutorialhub.com |
| Root Directory | `apps/api-server` |
| Framework | Next.js |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Node Version | 20.x |
| **Environment Variables** | DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CSRF_SECRET, NODE_ENV |

### Project 3: Admin App

| Setting | Value |
|---------|-------|
| Name | quiz-platform-admin-app |
| Domain | admin.realtutorialhub.com |
| Root Directory | `apps/admin-app` |
| Framework | Next.js |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Node Version | 20.x |
| **Environment Variables** | `NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com/api` |

---

## 🔍 Verification Steps

After deployment:

### 1. Check API Server

Visit: `https://api.realtutorialhub.com/api/status`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T..."
}
```

### 2. Check Web App

Visit: `https://quiz.realtutorialhub.com/signup`

The signup form should load without errors.

### 3. Test Signup Flow

1. Go to: `https://quiz.realtutorialhub.com/signup`
2. Fill in the form
3. Submit
4. Should create user successfully

---

## 🐛 Common Issues

### Issue 1: API Server 404

**Symptom**: `https://api.realtutorialhub.com` returns 404

**Solution**: 
- Verify Root Directory is set to `apps/api-server`
- Check deployment logs for errors
- Ensure all environment variables are set

### Issue 2: CORS Errors

**Symptom**: Browser shows CORS policy errors

**Solution**: API server already has CORS middleware configured. Ensure:
- API server is deployed
- Environment variables are set correctly

### Issue 3: Database Connection Failed

**Symptom**: API returns 500 errors

**Solution**:
- Verify DATABASE_URL is correct
- Check Neon PostgreSQL is accessible
- Run database migrations (if needed)

---

## 📊 Deployment Checklist

- [ ] API Server deployed to Vercel
- [ ] API Server domain configured: `api.realtutorialhub.com`
- [ ] API Server environment variables set
- [ ] Web App environment variable updated: `NEXT_PUBLIC_API_URL`
- [ ] Web App redeployed
- [ ] DNS records configured
- [ ] API health check passes: `/api/status`
- [ ] Signup flow works end-to-end

---

## 🚀 Quick Deploy Commands

### Commit and Push Changes

```bash
cd d:\onlinewebsites\quiz-platform

# Add environment file changes
git add apps/web-app/.env.local
git add apps/api-server/.env.local

# Commit
git commit -m "feat: add production environment configuration"

# Push
git push origin main
```

⚠️ **Note**: `.env.local` files should NOT be committed to git. Instead, set environment variables directly in Vercel dashboard.

---

## 🎯 Next Steps

1. **Deploy API Server** to Vercel (most critical)
2. **Update Web App** environment variables
3. **Test the signup flow**
4. **Deploy Admin App** (optional, for later)

---

## 💡 Pro Tips

1. **Use Vercel CLI** for faster deployments:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Preview Deployments**: Every git push creates a preview deployment

3. **Environment Variables**: Use Vercel dashboard to manage secrets securely

4. **Monitoring**: Enable Vercel Analytics and Speed Insights

---

**Created**: 2026-01-24  
**Priority**: Deploy API Server ASAP  
**Status**: Web App live, API Server pending
