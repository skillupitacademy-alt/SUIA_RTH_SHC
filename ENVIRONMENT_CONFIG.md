# Environment Configuration Guide

## Automatic Environment Detection ✨

The application now **automatically detects** the environment and uses the correct API URL:

### Local Development
- **Hostname**: `localhost` or `127.0.0.1`
- **API URL**: `http://localhost:3000`
- **No configuration needed!**

### Vercel Preview
- **Hostname**: `*.vercel.app`
- **API URL**: Automatically constructed from preview URL
- **Example**: `quiz-platform-web-app-git-preview-xxx.vercel.app` → `quiz-platform-api-server-git-preview-xxx.vercel.app`

### Production
- **Hostname**: `quiz.realtutorialhub.com` or `admin.realtutorialhub.com`
- **API URL**: `https://api.realtutorialhub.com`

## Manual Override (Optional)

If you need to override the automatic detection, create environment files:

### Local Override
Create `apps/web-app/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Vercel Environment Variables
In Vercel dashboard → Project Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api.realtutorialhub.com
```

## How It Works

The `api-client` package checks:
1. **Environment variable** first (if set)
2. **Browser hostname** to detect environment
3. **Fallback** to production URL for SSR

## Benefits

✅ **No manual configuration** needed for different environments  
✅ **Works automatically** in local, preview, and production  
✅ **Can still override** if needed  
✅ **No more deployment errors** due to wrong API URLs  

## Testing

### Local Development
```bash
# Terminal 1
cd apps/api-server
pnpm dev

# Terminal 2
cd apps/web-app
pnpm dev
```

Visit `http://localhost:3001` - it will automatically use `http://localhost:3000` for API calls!

### Production
Deploy to Vercel - it will automatically use `https://api.realtutorialhub.com`!
