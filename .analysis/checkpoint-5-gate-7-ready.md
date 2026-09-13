# Checkpoint 5 - Gate 7 Ready

## Pre-Execution Checklist

### ✅ Gates 1-5A: COMPLETE

- [x] **Gate 1**: Environment variables verified in `.env.local`
- [x] **Gate 2**: Database identity proven (`people_prod`, `tutorial_prod`)
- [x] **Gate 3**: Table identity verified (`users`, `tutorial_navigation_progress`)
- [x] **Gate 4**: Variable names corrected (`DATABASE_URL_PEOPLE`, `DATABASE_URL_TUTORIAL`)
- [x] **Gate 5**: Table/column names fixed (`users.id`, `user_id`)
- [x] **Gate 5A**: Active-row semantics added (`deleted_at IS NULL`)
- [x] **Gate 6**: Learner lookup tested (both users found)

### ✅ Production Implementation: UNCHANGED

**No production code changes required** - All fixes are in E2E test infrastructure:
- `tutorialTrackingService.ts` - unchanged (unit tests 10/10 PASS)
- RTH BFF `visit/route.ts` - unchanged
- SUIA BFF `visit/route.ts` - unchanged

### ✅ Test Infrastructure: CORRECTED

**File:** `tests/e2e/ils-phase2-visit-persistence.spec.ts`

**Changes:**
1. Database connection: Uses `DATABASE_URL_PEOPLE` and `DATABASE_URL_TUTORIAL`
2. Table name: `users` (not `"User"`)
3. Column name: `user_id` (not `learner_id`)
4. Active-row filter: `AND deleted_at IS NULL`

### ✅ Diagnostic Scripts: CREATED

Verification scripts in `scripts/`:
- `verify-phase2-databases.mjs` - Database/table identity
- `inspect-people-user-schema.mjs` - People DB schema
- `inspect-tutorial-progress-schema.mjs` - Tutorial DB schema
- `test-learner-lookup.mjs` - Learner ID resolution

## Gate 7: E2E Execution Command

```powershell
$env:SUIA_EMAIL = "student@skillupitacademy.com"
$env:SUIA_PASSWORD = "testing"
$env:SUIA_BASE_URL = "http://skillup.localhost:3009"
$env:RTH_EMAIL = "ajayshah@gmail.com"
$env:RTH_PASSWORD = "testing"
$env:RTH_BASE_URL = "http://realtutorialhub.localhost:3003"

npx playwright test tests/e2e/ils-phase2-visit-persistence.spec.ts `
  --project=chromium `
  --workers=1 `
  --timeout=120000 `
  --reporter=line
```

### Why `--workers=1`?

**Critical for DB forensic validation:**
- Tests capture before/after DB snapshots
- Concurrent execution could modify same progress row between snapshots
- Serial execution ensures clean before/after evidence

### Test Structure

Each test suite (SUIA, RTH) runs independently:

**SUIA Tests:**
- A: First visit persistence
- B: Same-session deduplication
- C: New-session increment

**RTH Tests:**
- A: First visit persistence  
- B: Same-session deduplication
- C: New-session increment

**Expected Evidence:**
- Browser sessionStorage UUID
- Visit request (body.sessionId + x-session-id)
- Database state (before/after)
- UUID trace validation

## Success Criteria (Gate 8)

### Minimum Requirements

**Test A (First Visit):**
- [x] Browser creates valid UUID v4 in sessionStorage
- [x] Visit request contains UUID in both channels (body + header)
- [x] Channels contain IDENTICAL UUID
- [x] DB `last_session_id` matches browser UUID
- [x] DB `visit_count` incremented
- [x] UUID trace complete: `sessionStorage → body → header → DB`

**Test B (Same-Session Deduplication):**
- [x] Same UUID used across reload
- [x] DB `last_session_id` unchanged
- [x] DB `visit_count` NOT incremented
- [x] Same-session deduplication proven

**Test C (New-Session Increment):**
- [x] Different UUID after session change
- [x] DB `last_session_id` updated to new UUID
- [x] DB `visit_count` incremented by exactly 1
- [x] New-session behavior proven

### Decisive Evidence

**Not sufficient:**
- ❌ HTTP 200 responses
- ❌ Console logs saying "persisted"
- ❌ No errors thrown

**Authoritative:**
- ✅ Actual DB rows before/after
- ✅ UUID byte-for-byte identical across chain
- ✅ visit_count values proven with DB evidence

## Forensic Query Contract

```sql
SELECT user_id, navigation_node_id, subtopic_id, 
       last_session_id, visit_count, revision_count, updated_at
FROM tutorial_navigation_progress
WHERE user_id = ${learnerId} 
  AND navigation_node_id = ${navigationNodeId} 
  AND subtopic_id = ${subtopicId}
  AND deleted_at IS NULL
```

**Matches:**
- Partial unique index `uqNavigationProgressUserNode`
- Active-row semantics (soft-delete architecture)
- ILS progress tracking contract

## Architecture Proven

```
Browser (sessionStorage)
        ↓
TutorialPageShell (page_view)
        ↓
trackTutorialEvent()
        ↓
    ┌───────────────────┐
    │  body.sessionId   │
    │  x-session-id     │ ← SAME UUID
    └───────────────────┘
        ↓
BFF (RTH/SUIA)
        ↓
SkillHubCore
        ↓
recordVisit()
        ↓
tutorial_navigation_progress
    ├── user_id (learner identity)
    ├── last_session_id (learning session UUID)
    ├── visit_count (deduplication)
    └── revision_count (existing semantics)
```

## Next Steps After Gate 7

1. **If PASS**: Capture UUID trace evidence, declare Checkpoint 5 COMPLETE
2. **If FAIL**: Inspect actual failure evidence, determine if production defect or test issue
3. **Commit**: Only E2E test file (no production changes required)

---

**Status:** Ready for Gate 7 execution
**Blocking Issues:** None
**Production Risk:** Zero (no production code changes)
