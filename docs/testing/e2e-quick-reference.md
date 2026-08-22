# E2E Testing Quick Reference

Fast reference for running E2E tests.

---

## Quick Start (3 Steps)

```bash
# 1. Start server (Terminal 1)
npm run dev

# 2. Run E2E test (Terminal 2)
node scripts/test-<feature>-e2e.mjs

# 3. Check results
# ✅ PASSED: X
# ❌ FAILED: 0
```

---

## Common Commands

### Start Servers

```bash
# All apps (Turborepo)
npm run dev

# Specific app
npm run dev --filter=@quiz/skillhubcore-admin
npm run dev --filter=@quiz/realtutorialhub-web
npm run dev --filter=@quiz/skillup-admin

# With PM2 (production-like)
npm run start:pm2
pm2 status
pm2 logs <app-name>
```

### Run E2E Tests

```bash
# Tutorial Composer (SkillHubCore)
node scripts/test-tutorial-composer-e2e.mjs

# Custom feature test
node scripts/test-<your-feature>-e2e.mjs

# With npm script (if defined)
npm run test:e2e
npm run test:e2e:tutorial-composer
```

### Verify Setup

```bash
# Check server is running
curl http://localhost:3007/api/health

# Check database
psql $DATABASE_URL -c "SELECT 1;"

# Check env vars
cat .env.local | grep ADMIN

# Check ports
netstat -an | grep 3007
lsof -i :3007  # macOS/Linux
```

### Debug Failed Tests

```bash
# View server logs
npm run dev  # Watch logs in this terminal

# Check database state
psql $DATABASE_URL

# Run single test function (modify script)
# Comment out other tests in main()

# Add verbose logging
# Add console.log() in test functions

# Check network
curl -v http://localhost:3007/api/auth/login
```

---

## Environment Variables

```env
# Required in .env.local
TEST_BASE_URL=http://localhost:3007
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_password
TEST_SUBTOPIC_ID=uuid-here
DATABASE_URL=postgresql://...
```

---

## Test Output Patterns

### ✅ Success

```
✅ [PASS] Login
✅ [PASS] Create Resource
✅ [PASS] Read Resource
...
✅ PASSED: 10
❌ FAILED: 0
✅ ALL TESTS PASSED
```

### ❌ Failure

```
❌ [FAIL] Create Resource
HTTP 500: Foreign key constraint violation
...
✅ PASSED: 2
❌ FAILED: 1
   - Create Resource
❌ TEST SUITE FAILED
DO NOT DEPLOY until all tests pass.
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` | Server not running | `npm run dev` first |
| `401 Unauthorized` | Invalid credentials | Check `.env.local` |
| `404 Not Found` | Wrong URL/endpoint | Verify `BASE_URL` |
| `500 Internal Error` | Server/DB issue | Check server logs |
| `Foreign key violation` | Missing related data | Run sync scripts |

---

## Files to Reference

| Purpose | File |
|---------|------|
| **Template** | `scripts/test-tutorial-composer-e2e.mjs` |
| **Guide** | `docs/testing/e2e-testing-guide.md` |
| **Env Example** | `.env.local.example` |
| **API Docs** | `docs/api/` |

---

## Before Deploying

```bash
# 1. All E2E tests pass
node scripts/test-<feature>-e2e.mjs
# ✅ ALL TESTS PASSED

# 2. Type-check passes
npm run type-check
# Tasks: X successful, X total

# 3. Build succeeds
npm run build
# No errors

# 4. Commit
git add .
git commit -m "feat: ..."
git push

# 5. Deploy
# (follow your deployment process)
```

---

## Tips

- **Always start server first** before running E2E tests
- **Check server logs** when tests fail
- **Use realistic test data** (copy from production)
- **Clean up test data** after each run
- **Don't commit** `.env.local` (use `.env.local.example`)
- **Test locally** before pushing to CI

---

**Need more details?** See `docs/testing/e2e-testing-guide.md`
