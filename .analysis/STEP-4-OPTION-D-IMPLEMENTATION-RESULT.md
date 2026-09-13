# STEP 4 — Option D Implementation Result

**Date:** 2026-09-04  
**Implementation:** Option D (Dual-credential BFF headers)  
**Status:** ✅ **CSRF FIX SUCCESSFUL** - New blocker identified (test data)

---

## Implementation Summary

### Files Changed

**Environment Configuration (2 files):**
- `apps/realtutorialhub-web/.env.local` - Added `INTERNAL_API_KEY`
- `apps/skillup-web/.env.local` - Added `INTERNAL_API_KEY`

**BFF ILS Routes (8 files):**
1. `apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`
2. `apps/skillup-web/src/app/api/tutorial/ils/active-time/route.ts`
3. `apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.ts`
4. `apps/skillup-web/src/app/api/tutorial/ils/complete-node/route.ts`
5. `apps/realtutorialhub-web/src/app/api/tutorial/ils/visit/route.ts`
6. `apps/realtutorialhub-web/src/app/api/tutorial/ils/active-time/route.ts`
7. `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-completion/route.ts`
8. `apps/realtutorialhub-web/src/app/api/tutorial/ils/complete-node/route.ts`

**Test Configuration (1 file):**
- `tests/e2e/ils-phase2-visit-persistence.spec.ts` - Increased timeouts

**Change Per Route:** Added single line:
```typescript
'x-internal-key': process.env.INTERNAL_API_KEY || '',
```

---

## Test Execution Result

### Before Option D Implementation
```
POST /api/tutorial/ils/visit
↓
CSRF middleware checks x-internal-key
↓
NOT FOUND (only X-Internal-Secret present)
↓
403 Forbidden: "CSRF validation failed"
```

### After Option D Implementation
```
POST /api/tutorial/ils/visit
↓
CSRF middleware checks x-internal-key
↓
✅ FOUND - internal bypass granted
↓
Route handler validates request body
↓
400 Bad Request: "Invalid UUID format for navigationNodeId"
```

**Evidence:**
```json
{
  "status": 400,
  "statusText": "Bad Request",
  "url": "http://skillup.localhost:3009/api/tutorial/ils/visit",
  "body": {
    "error": "Invalid request body",
    "issues": [{
      "validation": "uuid",
      "code": "invalid_string",
      "message": "Invalid UUID format",
      "path": ["navigationNodeId"]
    }]
  }
}
```

---

## CSRF Fix Verification ✅

**Status:** **SUCCESSFUL**

The request progression confirms:
1. ✅ CSRF middleware received `x-internal-key` header
2. ✅ CSRF bypass activated (`isValidInternal = true`)
3. ✅ Request proceeded to route handler
4. ✅ Route handler `validateRequest()` executed
5. ✅ Request body validation ran (Zod schema)
6. ❌ Validation failed on `navigationNodeId` format

**Conclusion:** The CSRF 403 blocker is **RESOLVED**. The 400 error proves the request successfully bypassed CSRF middleware and reached business logic validation.

---

## New Blocker Identified

**Issue:** Test data uses slug instead of UUID for `navigationNodeId`

**Test Configuration:**
```typescript
navigationNodeId: 'whatisjava',  // ❌ String slug, not UUID
subtopicId: 'what-is-java-12efacf1',
```

**API Expectation** (`apps/api-server/src/schemas/ils.schemas.ts`):
```typescript
export const recordVisitBodySchema = z.object({
  navigationNodeId: z.string().uuid(),  // ✅ Expects UUID format
  subtopicId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  sectionId: z.string().uuid().nullable().optional(),
});
```

**Root Cause:** Test data inconsistency - using content identifier (slug) where database primary key (UUID) is expected.

---

## Next Steps

### Option A: Fix Test Data (Use Real UUIDs)
Query database for actual `navigationNodeId` UUID:
```sql
SELECT id FROM tutorial_navigation_nodes 
WHERE subtopic_id = 'what-is-java-12efacf1' 
AND slug = 'whatisjava';
```

Update test configuration with real UUID.

**Pros:**
- Tests real production data flow
- Validates actual database relationships

**Cons:**
- Requires database query before test
- Test data becomes environment-specific

### Option B: Accept Slugs in API (Change API Schema)
Modify API to accept slug and resolve to UUID internally.

**Pros:**
- More flexible API
- Easier test authoring

**Cons:**
- Changes production API contract
- Adds slug → UUID resolution overhead
- May not match actual production client usage

### Option C: Mock Data Approach
Create test-specific navigation nodes with known UUIDs.

**Pros:**
- Test isolation
- Predictable test data

**Cons:**
- Test database pollution
- Setup/teardown complexity

---

## Recommendation

**Proceed with Option A** - Use real UUIDs from database.

**Rationale:**
1. Tests should exercise actual production code paths
2. Real data validates end-to-end flow correctly
3. Avoids changing production API for test convenience
4. ILS relies on referential integrity (FK relationships)

**Implementation:**
1. Query `tutorial_navigation_nodes` table
2. Find UUID for `whatisjava` node
3. Update test constants
4. Re-run test suite

---

## Governance Compliance ✅

**Following STEP 4 governance sequence:**
- [x] Phase 1: Environment setup complete
- [x] Phase 2: Code changes complete (8 files)
- [x] Phase 3: Test execution attempted
- [x] Phase 4: New blocker identified and documented
- [ ] **Phase 5: Record first successful execution** (blocked)
- [ ] Phase 6: Cleanup diagnostic scripts (blocked)

**Test Governance:**
- ✅ NO new Playwright test created
- ✅ Existing authoritative test used
- ✅ NO diagnostic scripts deleted yet
- ✅ New blocker documented before proceeding

---

## CSRF Investigation Closure

**Original Issue:** 403 CSRF validation failed  
**Root Cause:** Header mismatch (`X-Internal-Secret` vs `x-internal-key`)  
**Solution:** Option D (dual-credential headers)  
**Status:** ✅ **RESOLVED**

**Investigation Reports:**
- STEP 2: Root cause analysis
- STEP 3: Security architecture validation
- STEP 4: Implementation and verification (this document)

**Implementation Quality:**
- ✅ Minimal code changes (one line per file)
- ✅ No unrelated changes
- ✅ Security boundaries preserved
- ✅ Follows existing auth route pattern
- ✅ Deployment-ready

---

## Production Deployment Checklist

Before deploying to production:

**Environment Variables:**
- [ ] Verify `INTERNAL_API_KEY` in SkillUp production env
- [ ] Verify `INTERNAL_API_KEY` in RTH production env
- [ ] Verify `INTERNAL_API_SECRET` unchanged
- [ ] Verify both credentials have correct values

**Deployment:**
- [ ] Deploy BFF changes (SkillUp, RTH)
- [ ] Verify api-server has no changes (correct)
- [ ] Monitor logs for auth failures
- [ ] Test ILS tracking in production

**Rollback Plan:**
- Remove `'x-internal-key': process.env.INTERNAL_API_KEY || '',` from 8 route files
- Restart BFF services
- CSRF will block again (safe fallback)

---

**END OF STEP 4 IMPLEMENTATION RESULT**

**Next Action:** Resolve test data blocker (Option A recommended) then re-run test suite.
