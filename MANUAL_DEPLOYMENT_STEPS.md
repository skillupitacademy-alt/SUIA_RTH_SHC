# Manual Deployment Steps (If Script Fails)

If `DEPLOY_SIMPLE.ps1` encounters issues, follow these manual steps:

## Step 1: Copy File to VPS

```powershell
# From PowerShell in project root:
scp -i .\suia_rth `
    .\packages\auth\src\middleware\cookie.middleware.ts `
    root@72.61.115.49:/opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts
```

**Expected Output**: 
```
cookie.middleware.ts                100%  7KB   1.2MB/s   00:00
```

---

## Step 2: SSH to VPS

```powershell
ssh -i .\suia_rth root@72.61.115.49
```

---

## Step 3: Verify File Was Copied

```bash
# On VPS:
ls -lh /opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts
```

**Expected Output**:
```
-rw-r--r-- 1 root root 7.0K Jul  6 10:00 cookie.middleware.ts
```

---

## Step 4: Check Environment Variables

```bash
# On VPS:
grep COOKIE_DOMAIN /opt/platform/env/.env.production
```

**Expected Output**:
```
COOKIE_DOMAIN_RTH=.realtutorialhub.com
COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com
```

If missing, add them:
```bash
nano /opt/platform/env/.env.production

# Add these lines:
COOKIE_DOMAIN_RTH=.realtutorialhub.com
COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com
```

---

## Step 5: Navigate to Project

```bash
cd /opt/platform/apps/quiz-platform
```

---

## Step 6: Build Docker Images

```bash
./infra/hostinger/scripts/build.sh
```

**Expected Output**:
```
Repository: /opt/platform/apps/quiz-platform
Environment: /opt/platform/env/.env.production
Certificate dir: /opt/platform/nginx/certs
Log dir: /opt/platform/logs

[+] Building 234.5s (45/45) FINISHED
...
```

**This will take 5-10 minutes**

---

## Step 7: Deploy Containers

```bash
./infra/hostinger/scripts/deploy.sh
```

**Expected Output**:
```
✓ Container quiz-platform-nginx          Healthy
✓ Container quiz-platform-realtutorialhub-web  Healthy
✓ Container quiz-platform-skillup-web    Healthy
...
```

---

## Step 8: Verify Health

```bash
./infra/hostinger/scripts/health.sh
```

**Expected Output**:
```
All containers healthy
```

---

## Step 9: Check Logs (Optional)

```bash
# View all logs
docker compose -f ./infra/hostinger/compose/docker-compose.yml \
                -f ./infra/hostinger/compose/docker-compose.production.yml \
                logs --tail=50

# Or specific service
docker logs quiz-platform-realtutorialhub-web --tail=50
docker logs quiz-platform-skillup-web --tail=50
```

---

## Step 10: Exit VPS

```bash
exit
```

---

## Step 11: Test From Browser

1. **Clear browser cache and cookies completely**
2. Test RTH: https://user.realtutorialhub.com/signup
3. Test SUIA: https://user.skillupitacademy.com/signup
4. Should redirect to `/onboarding` (NOT back to `/signup`)

---

## Common Issues & Solutions

### Issue: "Permission denied" when copying file

**Solution**: Load SSH key first
```powershell
.\infra\hostinger\remote-ssh\load-hostinger-key.ps1
```

### Issue: Build fails with "No space left on device"

**Solution**: Clean up Docker
```bash
docker system prune -a
```

### Issue: Containers fail to start

**Solution**: Check logs
```bash
docker ps -a
docker logs <container-name>
```

### Issue: Still redirects to signup after deployment

**Solution**: Force rebuild without cache
```bash
cd /opt/platform/apps/quiz-platform
docker compose -f ./infra/hostinger/compose/docker-compose.yml \
                -f ./infra/hostinger/compose/docker-compose.production.yml \
                build --no-cache
./infra/hostinger/scripts/deploy.sh
```

---

## Need Help?

Share the exact error message you're seeing and I'll help troubleshoot!
