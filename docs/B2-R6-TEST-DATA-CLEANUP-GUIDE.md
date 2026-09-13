# B.2-R-6 Test Data Cleanup Guide

## Objective

Reset dummy ILS completion records for known test fixtures to establish clean baseline for contract validation.

**SCOPE:** Test data only - Known dummy fixtures created for RSSB/API testing

---

## Test Fixtures to Reset

### RTH Fixture (Has Orphaned Completions)
- **Email:** `ajayshah@gmail.com`
- **Brand:** `realtutorialhub`  
- **Navigation Node:** `whatisjava`
- **Current State:** 4 orphaned `gate-3c1r-*` completion references
- **Target State:** Clean (0 completions)

### SkillUp Fixture (Already Clean)
- **Email:** `student@skillupitacademy.com`
- **Brand:** `skillup`
- **Navigation Node:** `whatisjava`
- **Current State:** Clean (0 completions)
- **Action:** None needed

---

## Pre-Cleanup Inspection

### Step 1: Verify Current State

```sql
-- Check RTH fixture
SELECT 
  u.email,
  p.navigation_node_id,
  p.status,
  p.completed_blocks,
  jsonb_array_length(p.completed_blocks) as completed_count
FROM users u
JOIN tutorial_navigation_progress p ON u.id = p.user_id
WHERE u.email = 'ajayshah@gmail.com'
AND p.navigation_node_id = 'whatisjava'
AND p.deleted_at IS NULL
AND u.deleted_at IS NULL;
```

**Expected Result:**
```json
{
  "email": "ajayshah@gmail.com",
  "navigation_node_id": "whatisjava",
  "status": "in_progress",
  "completed_blocks": [
    {
      "blockId": "gate-3c1r-phase-d-block-le3-1789057672929-cbxbbt",
      "blockVersion": "D1",
      "completedAt": "2026-09-10T16:27:53.526Z"
    },
    {
      "blockId": "gate-3c1r-phase-d-block-le4-1789057673771-og3ccr",
      "blockVersion": "D1",
      "completedAt": "2026-09-10T16:27:54.612Z"
    },
    {
      "blockId": "gate-3c1r-phase-d-block-le7-1789057676750-8zifbx",
      "blockVersion": "D1",
      "completedAt": "2026-09-10T16:27:57.319Z"
    },
    {
      "blockId": "gate-3c1r-phase-d-completion-1789058906687-fjogsh",
      "blockVersion": "D1",
      "completedAt": "2026-09-10T16:48:29.168Z"
    }
  ],
  "completed_count": 4
}
```

---

## Cleanup Execution

### Step 2: Reset RTH Test Fixture

```sql
-- BEGIN TRANSACTION for safety
BEGIN;

-- Reset completedBlocks to empty array and status to not_started
UPDATE tutorial_navigation_progress
SET 
  completed_blocks = '[]'::jsonb,
  status = 'not_started',
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM users 
  WHERE email = 'ajayshah@gmail.com' 
  AND deleted_at IS NULL
)
AND navigation_node_id = 'whatisjava'
AND deleted_at IS NULL;

-- Verify the change before committing
SELECT 
  u.email,
  p.navigation_node_id,
  p.status,
  p.completed_blocks,
  jsonb_array_length(p.completed_blocks) as completed_count
FROM users u
JOIN tutorial_navigation_progress p ON u.id = p.user_id
WHERE u.email = 'ajayshah@gmail.com'
AND p.navigation_node_id = 'whatisjava'
AND p.deleted_at IS NULL
AND u.deleted_at IS NULL;

-- If verification looks correct, commit:
COMMIT;

-- If something is wrong, rollback:
-- ROLLBACK;
```

**Expected After State:**
```json
{
  "email": "ajayshah@gmail.com",
  "navigation_node_id": "whatisjava",
  "status": "not_started",
  "completed_blocks": [],
  "completed_count": 0
}
```

---

## Post-Cleanup Verification

### Step 3: Verify Both Fixtures

```sql
-- Check both test fixtures
SELECT 
  u.email,
  u.brand,
  p.navigation_node_id,
  p.status,
  jsonb_array_length(p.completed_blocks) as completed_count
FROM users u
LEFT JOIN tutorial_navigation_progress p 
  ON u.id = p.user_id 
  AND p.navigation_node_id = 'whatisjava'
  AND p.deleted_at IS NULL
WHERE u.email IN ('ajayshah@gmail.com', 'student@skillupitacademy.com')
AND u.deleted_at IS NULL
ORDER BY u.brand, u.email;
```

**Expected Result:**
```
email                         | brand            | navigation_node_id | status      | completed_count
------------------------------|------------------|-------------------|-------------|----------------
ajayshah@gmail.com            | realtutorialhub  | whatisjava        | not_started | 0
student@skillupitacademy.com  | skillup          | whatisjava        | not_started | 0
```

---

## API Re-Verification

### Step 4: Run B.2-R-4 Capture Again

```powershell
node scripts/.tmp-b2r4-working-api-capture.mjs
```

**Expected Console Output:**
```
[REALTUTORIALHUB]
  completedBlockCount: 0
  totalBlockCount: 2
  ✅ No contract inconsistency

[SKILLUP]
  completedBlockCount: 0
  totalBlockCount: 2
  ✅ No contract inconsistency

STATUS: ✅ API capture complete, no contract inconsistencies detected
```

**Expected API Response Structure:**
```json
{
  "data": {
    "completedBlockCount": 0,
    "totalBlockCount": 2,
    "completedBlocks": [],
    "progressPercentage": 0
  }
}
```

---

## Safety Notes

### What This Does NOT Touch

✅ User accounts remain intact  
✅ Subscription/billing data unchanged  
✅ Visit/telemetry data preserved  
✅ Other navigation nodes unaffected  
✅ Other users unaffected  
✅ Block learning state records preserved (if any)

### What This Resets

⚠️ RTH `whatisjava` completion references cleared  
⚠️ RTH `whatisjava` status reset to `not_started`  
⚠️ Removes 4 orphaned `gate-3c1r-*` completion records

### Rollback Procedure

If reset needs to be undone (within same session):

```sql
ROLLBACK; -- Only works if transaction hasn't been committed
```

If already committed, restoration requires:
1. Backup data from B.2-R-4 evidence file:
   `.analysis/b2r4-api-capture-2026-09-12T13-31-48.json`
2. Manual reconstruction of `completed_blocks` array
3. **NOT RECOMMENDED** - Better to proceed with clean state

---

## Execution Checklist

- [ ] Step 1: Run pre-cleanup inspection query
- [ ] Verify output matches expected 4 orphaned completions
- [ ] Step 2: Execute cleanup SQL in transaction
- [ ] Verify changes before committing
- [ ] Commit transaction
- [ ] Step 3: Run post-cleanup verification query
- [ ] Verify both fixtures show 0 completions
- [ ] Step 4: Re-run API capture script
- [ ] Verify API returns consistent 0/2 state
- [ ] Document completion in B.2-R-6 report

---

## Next Steps After Cleanup

1. **Implement Contract-Consistent DTO Filtering**
   - Filter orphaned references in `toDTO()` method
   - Ensure `completedBlockCount ≤ totalBlockCount`

2. **Add Contract Validation Tests**
   - Assert count relationship in unit tests
   - Test orphaned reference handling
   - Test content migration scenarios

3. **Re-verify End-to-End**
   - Run full B.2-R-4 capture again
   - Verify browser/RSSB behavior (if needed)
   - Document final certification

---

**Status:** READY FOR EXECUTION  
**Risk Level:** LOW (test data only, transaction-protected)  
**Approval Required:** Database write access
