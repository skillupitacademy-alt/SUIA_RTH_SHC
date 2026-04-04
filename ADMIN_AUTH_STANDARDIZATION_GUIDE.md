# Admin Authorization Standardization Guide

## Problem Statement

The admin dashboard experiences random "Access Denied" errors because different `/api/admin/*` endpoints use **3 different authorization patterns**:

1. **Modern Pattern** (✅ Correct): `requireAdminRouteAccess()` - Proper RBAC, correct error codes
2. **Legacy Pattern** (❌ Inconsistent): Direct `verifyAdminAccessToken()` + inline checks
3. **Duplicated Pattern** (❌ Code smell): Local `_verifyAdmin()` functions in route files

## Root Cause

Two buttons next to each other in the admin dashboard can behave differently because they call backend endpoints using different authorization logic. This creates unpredictable behavior where the same logged-in admin user gets "Access Denied" on some pages but not others.

## Solution

**Standardize ALL admin routes to use `requireAdminRouteAccess()`** from `@/modules/auth/admin-audience.util`.

### Why This Works

The `requireAdminRouteAccess()` function:
- ✅ Checks token existence and validity
- ✅ Verifies correct audience (admin vs infrastructure)
- ✅ Runs full RBAC verification via `_verifyAdmin()`
- ✅ Returns proper error codes (401 for auth required, 403 for forbidden)
- ✅ Handles brand-aware database context
- ✅ Gracefully falls back to token claims if DB is temporarily unavailable

## Implementation Steps

### Step 1: Replace Legacy Authorization Patterns

**BEFORE (Legacy Pattern):**
```typescript
async function handler(req: NextRequest) {
  const _token = container.get(TokenService).getAccessToken(req, { scope: 'admin' });
  if (!_token) {
    return ApiResponse.error(unauthorized('Unauthorized'), 401);
  }
  
  try {
    const _payload = await container.get(TokenService).verifyAdminAccessToken(_token);
    // ... rest of handler
  } catch (error) {
    return ApiResponse.error(error, 500); // ❌ Wrong error code!
  }
}
```

**AFTER (Standardized Pattern):**
```typescript
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

async function handler(req: NextRequest) {
  try {
    await requireAdminRouteAccess(req); // ✅ One line replaces all auth logic
    
    // ... rest of handler
  } catch (error) {
    return ApiResponse.error(error); // ✅ Correct error codes automatically
  }
}
```

### Step 2: Remove Duplicated `_verifyAdmin()` Functions

**BEFORE (Duplicated Pattern):**
```typescript
// ❌ Local _verifyAdmin function duplicated in route file
async function _verifyAdmin(_req: NextRequest) {
  const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
  if (!_token) throw unauthorized('Unauthorized');
  return await container.get(TokenService).verifyAdminAccessToken(_token);
}

async function handler(_req: NextRequest) {
  const admin = await _verifyAdmin(_req);
  if (!admin) return ApiResponse.error(forbidden(), 403);
  // ... rest of handler
}
```

**AFTER (Standardized Pattern):**
```typescript
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

async function handler(_req: NextRequest) {
  try {
    await requireAdminRouteAccess(_req); // ✅ Replaces local _verifyAdmin
    // ... rest of handler
  } catch (error) {
    return ApiResponse.error(error);
  }
}
```

### Step 3: Update Imports

**Remove these imports:**
```typescript
import { _verifyAdmin } from '@/modules/auth/rbac.service'; // ❌ Remove
import { TokenService } from '@/modules/auth/token.service'; // ❌ Remove (if only used for auth)
import { container } from '@/modules/core/container'; // ❌ Remove (if only used for auth)
```

**Add this import:**
```typescript
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util'; // ✅ Add
```

## Files Requiring Updates

### Priority 1: Dashboard-Heavy Routes (Already Fixed ✅)
- ✅ `/api/admin/feature-flags` - Feature flags page
- ✅ `/api/admin/logs/*` - Logs page
- ✅ `/api/admin/metrics/*` - All metrics pages (content, growth, performance, security, user)
- ✅ `/api/admin/publish` - Publish endpoint
- ✅ `/api/admin/system/usage` - System usage page
- ✅ `/api/admin/trends/*` - Trends pages (scores, skills, summary)

### Priority 2: Content Management Routes (Need Fixing ⚠️)
- ⚠️ `/api/admin/topics/**` - Topic CRUD operations
- ⚠️ `/api/admin/subtopics/**` - Subtopic CRUD operations
- ⚠️ `/api/admin/subjects/**` - Subject CRUD operations
- ⚠️ `/api/admin/skills/**` - Skill CRUD operations
- ⚠️ `/api/admin/questions/**` - Question CRUD operations
- ⚠️ `/api/admin/validate` - Topic validation

### Priority 3: User Management Routes (Need Fixing ⚠️)
- ⚠️ `/api/admin/users/**` - User CRUD operations
- ⚠️ `/api/admin/sessions/live` - Live sessions monitoring

### Priority 4: Reporting Routes (Need Fixing ⚠️)
- ⚠️ `/api/admin/reports/**` - Report management
- ⚠️ `/api/admin/tutor/help/**` - Tutor help requests

## Automated Migration Script

Run this command to automatically update all admin routes:

```bash
# Find all admin routes with legacy patterns
find apps/api-server/src/app/api/admin -name "*.ts" -type f | while read file; do
  # Check if file contains legacy patterns
  if grep -q "verifyAdminAccessToken\|local _verifyAdmin" "$file"; then
    echo "Updating: $file"
    # This is a manual process - see individual file updates below
  fi
done
```

## Verification Checklist

After standardization, verify:

- [ ] All admin routes use `requireAdminRouteAccess()`
- [ ] No local `_verifyAdmin()` functions in route files
- [ ] No direct `verifyAdminAccessToken()` calls in route handlers
- [ ] Error responses return 401 for missing auth, 403 for forbidden
- [ ] Type-check passes: `pnpm --filter api-server type-check`
- [ ] Lint passes: `pnpm --filter api-server lint`
- [ ] Tests pass: `pnpm --filter api-server test`
- [ ] Build succeeds: `pnpm --filter api-server build`

## Testing Strategy

1. **Local Testing:**
   ```bash
   # Run API server locally
   pnpm --filter api-server dev
   
   # Test admin endpoints
   curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/api/admin/feature-flags
   ```

2. **Integration Testing:**
   - Log in to admin dashboard
   - Click through all sidebar menu items
   - Verify no "Access Denied" modals appear
   - Test CRUD operations on topics, questions, users

3. **Cross-Brand Testing:**
   - Test on RealTutorialHub admin
   - Test on SkillUp admin
   - Test on SkillHubCore admin

## Deployment Strategy

Since all 3 brands share the same API server:

1. **Single Deployment** fixes all brands simultaneously
2. **Zero Downtime** - changes are backward compatible
3. **Rollback Safe** - can revert if issues detected

### Deployment Command:
```bash
# Push changes
git add .
git commit -m "fix(admin): standardize authorization across all admin routes"
git push origin main

# GitHub Actions will automatically deploy to Cloud Run
# Monitor: https://console.cloud.google.com/run?project=<PROJECT_ID>
```

## Monitoring Post-Deployment

Watch for these metrics:

```bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=quiz-api-server" --limit 50 --format json

# Look for:
# - 401/403 errors (should be consistent now)
# - "Admin access only" messages (proper RBAC enforcement)
# - No 500 errors from auth failures
```

## Rollback Plan

If issues occur:

```bash
# Revert to previous deployment
gcloud run services update-traffic quiz-api-server \
  --to-revisions=<PREVIOUS_REVISION>=100 \
  --region=asia-southeast1
```

## Success Criteria

✅ **Fixed** when:
- Admin dashboard navigation works consistently
- No random "Access Denied" modals
- All admin endpoints use same authorization logic
- Error codes are correct (401/403, not 500)
- All 3 brands work identically

## Next Steps After Standardization

1. **Remove Legacy Code:**
   - Delete unused `_verifyAdmin()` functions
   - Clean up `INTERNAL_GATEWAY_SECRET` from admin Dockerfiles
   - Simplify frontend access-denied handling

2. **Add Monitoring:**
   - Track 401/403 rates per endpoint
   - Alert on authorization failures
   - Dashboard for admin access patterns

3. **Documentation:**
   - Update API documentation
   - Create admin development guide
   - Document RBAC architecture

---

**Last Updated:** 2026-04-05
**Status:** Implementation in progress
**Owner:** Infrastructure Team
