# Redis Migration — Production Application Verification Checkpoint

**Date:** 2026-09-30

**Status:** PASS

The production application was verified through its normal authenticated application path.

## Verified execution path

```
SkillHubCore Admin Login
→ /api/shc/auth/login
→ access token
→ /api/admin/system/usage
→ UsageService.getRedisUsage()
→ cacheService.getUsage()
→ redis.info("memory")
→ redis.dbsize()
→ current Upstash Redis database
```

## Observed result

* Authentication: successful
* System usage endpoint: HTTP 200
* Redis configured: `true`
* Redis status: `ok`
* Redis keys: `0`
* Redis memory: `0B`
* Redis memory bytes: `0`
* Redis usage: `0%`
* No Redis error returned

## Deployment evidence

The deployed API server uses the Upstash REST Redis implementation with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

The deployed server metadata identifies `@upstash/redis` version `^1.36.2`.

## Migration context

**Previous endpoint:** `national-goose-7390.upstash.io` (deleted, returns NXDOMAIN)  
**Current endpoint:** `aware-weasel-320883.upstash.io` (AWS Singapore)

Production environment files updated:
- `/opt/platform/env/shared/.env`
- `/opt/platform/env/.env.production`

## Scope

This checkpoint proves the production `cacheService.getUsage()` Redis path, specifically `info("memory")` and `dbsize()`. It does not claim that every Redis operation used elsewhere in the platform was individually exercised.

## Security

Credentials exposed during diagnostic work are considered compromised and must be rotated separately. No secret values are stored in this checkpoint.

## Next steps

1. Regenerate Upstash REST token at console.upstash.com
2. Update production environment files with new token
3. Restart affected containers
4. Re-verify Redis operations with new credentials
5. Rotate SkillHubCore admin password
6. Re-verify admin authentication with new password
7. Invalidate old credentials

## Verification script

See `scripts/test-admin-redis.mjs` for the production verification script used.
