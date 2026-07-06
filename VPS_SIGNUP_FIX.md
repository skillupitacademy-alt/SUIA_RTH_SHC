# VPS Signup Redirect Issue - Fix Guide

## 🔍 Problem

After signup on VPS deployment (`https://user.skillupitacademy.com/signup` and `https://user.realtutorialhub.com/signup`), users are being redirected back to the signup page instead of the onboarding page.

## 🎯 Root Cause

**Cookie domain mismatch** - The authentication cookies are being set with domains that don't match your VPS hostname configuration.

### Why This Happens:

1. The cookie middleware was using **hardcoded domains** (`.realtutorialhub.com`, `.skillupitacademy.com`)
2. Your VPS might be using:
   - Different domain names
   - IP addresses
   - Localhost for testing
3. When domains don't match, browsers reject cookies
4. After signup, `fetchBackendAuthState()` finds no cookies → thinks user is not authenticated → redirects to signup

## ✅ Solution Applied

### Code Change:

Modified `packages/auth/src/middleware/cookie.middleware.ts` to use environment variables:

```typescript
const BRAND_CONFIG = {
  realtutorialhub: {
    domain: process.env.COOKIE_DOMAIN_RTH || process.env.COOKIE_DOMAIN || '.realtutorialhub.com',
    // ...
  },
  skillup: {
    domain: process.env.COOKIE_DOMAIN_SKILLUP || process.env.COOKIE_DOMAIN || '.skillupitacademy.com',
    // ...
  },
}
```

## 🛠️ VPS Deployment Steps

### Step 1: Update Environment Variables

On your VPS, ensure your `.env` file has the correct cookie domains:

```bash
# If your VPS uses the actual domain names:
COOKIE_DOMAIN_RTH=.realtutorialhub.com
COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com

# OR if using different domains on VPS (e.g., testing subdomain):
COOKIE_DOMAIN_RTH=.yourvpsdomain.com
COOKIE_DOMAIN_SKILLUP=.yourvpsdomain.com

# OR for local testing without domain:
COOKIE_DOMAIN_RTH=localhost
COOKIE_DOMAIN_SKILLUP=localhost
```

**Important:** The cookie domain MUST match your actual hostname:
- If accessing via `user.realtutorialhub.com` → use `.realtutorialhub.com`
- If accessing via `192.168.1.100` → use `192.168.1.100` (no dot prefix for IPs)
- If accessing via `localhost` → use `localhost`

### Step 2: Check ALLOWED_ORIGINS

Make sure your VPS domains are in the CORS allowed origins:

```bash
ALLOWED_ORIGINS=https://user.realtutorialhub.com,https://admin.realtutorialhub.com,https://user.skillupitacademy.com,https://admin.skillupitacademy.com,https://faculty.skillupitacademy.com
```

### Step 3: Verify Internal URLs

Ensure these are set correctly for your VPS:

```bash
# Gateway URLs (where API requests go)
GATEWAY_URL=https://api.realtutorialhub.com
GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com

# Internal API URL (for BFF to API communication)
INTERNAL_API_URL=http://localhost:3000  # Or your internal API endpoint
```

### Step 4: Rebuild and Restart Services

```bash
# 1. Rebuild the affected services
cd /opt/platform  # Or your VPS deployment directory

# 2. Install dependencies if needed
npm install

# 3. Rebuild packages (auth package was modified)
npm run build

# 4. Restart services
pm2 restart all
# OR if using docker:
docker-compose restart
```

### Step 5: Clear Browser Data (Important!)

After deployment, users need to:
1. Clear cookies for your domain
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Try signup/login again

## 🧪 Testing

### Test 1: Verify Cookie Setting

1. Open browser DevTools (F12)
2. Go to **Application** → **Cookies**
3. Sign up with a test account
4. Check if cookies `accessToken` and `refreshToken` are set with correct domain

**Expected:**
```
Name: accessToken
Value: eyJhbGc...
Domain: .realtutorialhub.com  (should match your domain)
Path: /
Secure: ✓
HttpOnly: ✓
SameSite: None
```

### Test 2: Verify Auth Flow

```bash
# 1. Signup
curl -X POST https://user.realtutorialhub.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-brand: realtutorialhub" \
  -d '{"email":"test@example.com","password":"Test@123","name":"Test User"}' \
  -v

# Check response headers for Set-Cookie with correct domain

# 2. Check session with cookies
curl https://user.realtutorialhub.com/api/profile \
  -H "Cookie: accessToken=<token_from_signup>" \
  -v

# Should return user profile, not 401
```

### Test 3: End-to-End Flow

1. Visit `https://user.realtutorialhub.com/signup`
2. Fill in signup form
3. Submit
4. **Expected**: Redirect to `/onboarding` (not back to `/signup`)
5. Complete onboarding
6. **Expected**: Redirect to `/dashboard`

## 🐛 Troubleshooting

### Issue: Still redirecting to signup

**Check:**
```bash
# 1. Verify environment variables are loaded
pm2 env <process-id>  # Or check your .env file

# 2. Check PM2 logs for auth errors
pm2 logs --lines 100

# 3. Look for cookie domain logs
grep "COOKIE" /var/log/your-app.log
```

### Issue: Cookies not being set

**Possible causes:**
- **HTTPS required**: SameSite=None cookies require Secure flag, which needs HTTPS
- **Domain mismatch**: Cookie domain doesn't match hostname
- **CORS issue**: Origin not in ALLOWED_ORIGINS

**Solution:**
```bash
# For local dev without HTTPS, temporarily change in cookie.middleware.ts:
sameSite: 'lax' as const,  # Instead of 'none'
secure: false,             # Instead of true (ONLY FOR LOCAL DEV!)
```

### Issue: Works on one domain but not the other

**Check your VPS configuration:**
```bash
# Are both domains pointing to the same server?
nslookup user.realtutorialhub.com
nslookup user.skillupitacademy.com

# Do both have valid SSL certificates?
curl -I https://user.realtutorialhub.com
curl -I https://user.skillupitacademy.com
```

## 📋 Checklist

- [ ] Updated `packages/auth/src/middleware/cookie.middleware.ts` (already done)
- [ ] Set `COOKIE_DOMAIN_RTH` and `COOKIE_DOMAIN_SKILLUP` in VPS `.env`
- [ ] Verified `ALLOWED_ORIGINS` includes your domains
- [ ] Verified `GATEWAY_URL` and `GATEWAY_URL_SKILLUP` are correct
- [ ] Rebuilt the application (`npm run build`)
- [ ] Restarted services (PM2/Docker)
- [ ] Cleared browser cookies and cache
- [ ] Tested signup flow end-to-end
- [ ] Verified cookies are set with correct domain in DevTools

## 🔄 Migration from GCP to VPS

If you recently migrated from GCP (Cloud Run) to VPS (Hostinger):

### Key Differences:

| Aspect | GCP Cloud Run | VPS Hostinger |
|--------|---------------|---------------|
| Environment | Managed, auto-scaling | Self-managed |
| Secrets | Secret Manager | `.env` files or vault |
| Cookie Domain | Auto from hostname | Must configure explicitly |
| SSL/TLS | Auto with custom domain | Must configure (Let's Encrypt) |

### Additional VPS Considerations:

1. **SSL Certificates**: Ensure valid SSL certs for HTTPS (required for secure cookies)
   ```bash
   certbot --nginx -d user.realtutorialhub.com
   ```

2. **Nginx Configuration**: Check proxy headers
   ```nginx
   location / {
     proxy_pass http://localhost:3000;
     proxy_set_header Host $host;
     proxy_set_header X-Forwarded-Proto $scheme;
     proxy_set_header X-Forwarded-Host $host;
   }
   ```

3. **Firewall**: Ensure ports 80 and 443 are open

4. **DNS**: Verify both domains point to your VPS IP

## 📞 Support

If issues persist after following this guide:

1. Check PM2/Docker logs: `pm2 logs` or `docker-compose logs`
2. Enable debug logging: `LOG_LEVEL=debug` in `.env`
3. Test with curl to isolate browser vs server issues
4. Verify DNS and SSL certificate status

## 🎓 Understanding the Fix

The fix makes cookie domains **environment-aware**:

**Before:**
```typescript
domain: '.realtutorialhub.com'  // Hardcoded ❌
```

**After:**
```typescript
domain: process.env.COOKIE_DOMAIN_RTH || '.realtutorialhub.com'  // Configurable ✅
```

This allows you to:
- Use production domains in production
- Use test domains in staging
- Use localhost in development
- Deploy to any VPS with any domain name
