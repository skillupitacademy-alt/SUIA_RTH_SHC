# Environment Configuration Guide

## Automatic Environment Detection ✨

The application now **automatically detects** the environment and uses the correct API URL (optimized for Production/Vercel):

### Vercel Preview
- **Hostname**: `*.vercel.app`
- **API URL**: Automatically constructed from preview URL
- **Example**: `quiz-platform-web-app-git-preview-xxx.vercel.app` → `quiz-platform-api-server-git-preview-xxx.vercel.app`

### Production
- **Hostname**: `quiz.realtutorialhub.com` or `admin.realtutorialhub.com`
- **API URL**: `https://api.realtutorialhub.com`

## Manual Override (Optional)

If you need to override the automatic detection, create environment variables in the Vercel dashboard:

### Vercel Project Settings
In Vercel dashboard → Project Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com
```

## How It Works

The `api-client` package checks:
1. **Environment variable** first (if set)
2. **Browser hostname** to detect environment (Vercel Preview or Production)
3. **Fallback** to production URL for absolute reliability

## Benefits

✅ **No manual configuration** needed  
✅ **Works automatically** in preview and production  
✅ **Strictly production-ready** configuration  
✅ **No more deployment errors** due to wrong API URLs  

## ⚠️ Git Push Policy
**DO NOT push to GitHub automatically.** 
- Local changes should be committed locally but **NOT pushed**.
- Reason: Vercel deployment limits (100/day).
- Only push when explicitly requested by user.

## 📝 Change Log

### 2026-01-27
- **Deprecation**: Removed all `localhost` and `127.0.0.1` configuration guides.
- **Optimization**: Switched logic to strictly handle Vercel subdomains (quiz., api., admin.) and preview patterns.
