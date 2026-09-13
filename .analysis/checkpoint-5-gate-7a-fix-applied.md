# Checkpoint 5 - Gate 7A Fix Applied

## Issue Identified

Gate 7 execution revealed that E2E tests were passing **public route slug** as database **subtopic_id UUID**:

```
ERROR: invalid input syntax for type uuid: "what-is-java-12efacf1"
```

**Root Cause:** Test config hardcoded:
```typescript
subtopicId: 'what-is-java-12efacf1'  // This is a SLUG, not a UUID
```

But database schema requires:
```
tutorial_navigation_progress.subtopic_id → UUID
```

## Solution Applied

**Changed approach:** Instead of hardcoding IDs, **capture ACTUAL values from application's Visit request**.

### Before (WRONG):
```typescript
// Test config
const cfg = {
  navigationNodeId: 'whatisjava',
  subtopicId: 'what-is-java-12efacf1',  // SLUG!
};

// Query DB with hardcoded values
const after = await queryProgress(
  learnerId!,
  cfg.navigationNodeId,      // Might work (text)
  cfg.subtopicId              // FAILS (slug ≠ UUID)
);
```

### After (CORRECT):
```typescript
// Capture Visit request
let visitRequest: Request | null = null;
page.on('request', (request) => {
  if (request.url().includes('/api/tutorial/ils/visit')) {
    visitRequest = request;
  }
});

// ... trigger page_view ...

// Extract ACTUAL IDs from application
const requestBody = visitRequest!.postDataJSON();
const actualNavigationNodeId = requestBody.navigationNodeId;
const actualSubtopicId = requestBody.subtopicId;

// Validate application sent proper UUID
expect(actualSubtopicId, 'Visit request must contain subtopic UUID')
  .toMatch(UUID_V4_REGEX);

// Query DB with ACTUAL values
const after = await queryProgress(
  learnerId!,
  actualNavigationNodeId,   // Application's actual value
  actualSubtopicId          // Application's actual UUID
);
```

## Tests Fixed

Applied to all 6 tests:

**SUIA:**
- ✅ Test A: First visit - captures actual IDs from Visit request
- ✅ Test B: Same-session deduplication - uses actual IDs
- ✅ Test C: New-session increment - uses actual IDs

**RTH:**
- ✅ Test A: First visit - captures actual IDs from Visit request
- ✅ Test B: Same-session deduplication - uses actual IDs
- ✅ Test C: New-session increment - uses actual IDs

## Benefits

### 1. Eliminates Identity Mismatch
No longer assumes public URL slug = database entity UUID

### 2. Tests Actual Application Behavior
Validates what the application **actually sends**, not what test **assumes** it should send

### 3. Stronger Forensic Validation
Now proves:
> "The DB row I'm querying is the exact entity the application tried to persist"

### 4. Catches Real Issues
If application sends wrong UUID format, test will fail with clear error:
```typescript
expect(actualSubtopicId).toMatch(UUID_V4_REGEX);
// FAIL if application sends slug instead of UUID
```

## Files Modified

- `tests/e2e/ils-phase2-visit-persistence.spec.ts` - All 6 tests updated

## No Production Changes

✅ Zero production code modified
✅ Only E2E test infrastructure corrected
✅ Implementation remains unchanged from Checkpoint 4A

## Gate 7A Status

✅ **COMPLETE** - Subtopic identity contract fixed

**Remaining Issue:** Login timeout (separate authentication/infrastructure issue)

## Next: Gate 7B

Need to diagnose why login doesn't complete:
```
page.waitForURL((url) => !url.href.includes('/login'))
→ TIMEOUT (stays on /login)
```

This is unrelated to the persistence implementation and requires separate investigation of authentication flow.
