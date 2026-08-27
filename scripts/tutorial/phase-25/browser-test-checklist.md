# Phase 2.5 — D1 Browser Test Checklist

**Purpose:** Manual browser verification of D1 rendering and runtime context

---

## Prerequisites

✅ Admin server running: `http://localhost:3007`  
✅ D1 database record exists: `5326eeb6-c4c8-4218-9687-2b46f94a9bb4`  
✅ navigationNodeId: `whatisjava`  
✅ Block ID: `7ff97553-b343-46cf-b615-f58a275261f0`  
✅ TypeScript: 0 errors  
✅ Services: All running

---

## Test 1: Composer Access

1. Open: `http://localhost:3007/tools/tutorial-page-content`
2. **Expected:** Composer page loads (may require login)
3. **Verify:** No console errors
4. **Verify:** Page renders correctly

---

## Test 2: D1 Selection

1. Select brand: `shared`
2. Select hierarchy to find "What Is Java?"
3. Select navigationNodeId: `whatisjava`
4. **Expected:** D1 loads in editor
5. **Verify:** Title: "What Is Java?"
6. **Verify:** 4 characteristics visible
7. **Verify:** No 500 error
8. **Verify:** navigationNodeId in response

---

## Test 3: D1 Save

1. Make minor edit (add space, remove space)
2. Click Save
3. **Expected:** HTTP 200 or 201 (NOT 500)
4. **Verify:** Success message
5. **Verify:** Page doesn't crash
6. **Verify:** Data persists after refresh

---

## Test 4: Network Inspection

Open DevTools → Network tab

### GET Request
- **URL:** `/api/tutorial-composer/sections/5326eeb6-c4c8-4218-9687-2b46f94a9bb4`
- **Method:** GET
- **Status:** 200
- **Response should include:**
  ```json
  {
    "data": {
      "id": "5326eeb6-c4c8-4218-9687-2b46f94a9bb4",
      "navigationNodeId": "whatisjava",
      "content": {
        "blocks": [{
          "id": "7ff97553-b343-46cf-b615-f58a275261f0",
          "type": "definition",
          "version": "D1",
          "content": {
            "page": {
              "title": "What Is Java?",
              ...
            }
          }
        }]
      }
    }
  }
  ```

### PATCH Request (on save)
- **URL:** `/api/tutorial-composer/sections/5326eeb6-c4c8-4218-9687-2b46f94a9bb4`
- **Method:** PATCH
- **Status:** 200 (NOT 500)
- **Response should include:**
  ```json
  {
    "data": {
      "id": "5326eeb6-c4c8-4218-9687-2b46f94a9bb4",
      "navigationNodeId": "whatisjava",
      ...
    }
  }
  ```

---

## Test 5: Console Inspection

Open DevTools → Console tab

### No Errors Expected
- ❌ No `runtimeContext undefined`
- ❌ No `navigationNodeId undefined`
- ❌ No `blockVersion undefined`
- ❌ No hydration errors
- ❌ No React rendering errors
- ❌ No 500 API errors

### Warnings OK
- ⚠️ Favicon 404 (not related to Tutorial Engine)
- ⚠️ Next.js development warnings (normal)

---

## Test 6: D1 Learner Route (Future)

**BLOCKED:** Requires published tutorial + learner auth

Once D1 is published:
1. Get actual learner URL for "What Is Java?"
2. Login as learner
3. Navigate to D1
4. **Expected:** D1 renders correctly
5. **Verify:** Runtime context propagates
6. **Verify:** blockId = `7ff97553-b343-46cf-b615-f58a275261f0`
7. **Verify:** blockVersion = `D1`
8. **Verify:** navigationNodeId = `whatisjava`

---

## Test 7: Runtime Context (Future Browser Console)

In learner route, open console and run:
```javascript
// This would need to be exposed for debugging
window.__TUTORIAL_RUNTIME_CONTEXT__
```

**Expected:**
```json
{
  "learnerId": "...",
  "navigationNodeId": "whatisjava",
  "sectionId": "5326eeb6-c4c8-4218-9687-2b46f94a9bb4",
  "blockId": "7ff97553-b343-46cf-b615-f58a275261f0",
  "blockType": "definition",
  "blockVersion": "D1",
  "subtopicId": "414f63eb-cccf-4bd1-bcc0-b52df69ce499"
}
```

---

## Test 8: Block Completion Tracking (Future)

**BLOCKED:** Requires learner auth + published content

1. View D1 as learner
2. Scroll through content
3. Open Network tab
4. **Expected:** POST to `/api/tutorial/progress`
5. **Verify:** Request payload includes:
   ```json
   {
     "subtopicId": "414f63eb-cccf-4bd1-bcc0-b52df69ce499",
     "blockType": "definition",
     "status": "viewed"
   }
   ```
6. **Verify:** Response: 200
7. **Verify:** No console errors

---

## Test 9: Progress Persistence

**BLOCKED:** Requires learner auth + published content

1. Complete D1
2. Navigate away
3. Return to D1
4. **Expected:** Still marked complete
5. **Verify:** GET `/api/tutorial/progress?subtopicId=...` includes `blocksCompleted: ["definition"]`

---

## Test 10: Failure Isolation

**BLOCKED:** Requires learner auth + published content

Simulate tracking failure:
1. Block `/api/tutorial/progress` in DevTools Network tab
2. View D1
3. **Expected:** D1 still renders
4. **Expected:** Console shows tracking error (logged, not thrown)
5. **Expected:** No blank page
6. **Expected:** No React crash

---

## Current Status

### CAN TEST NOW ✅
- Test 1: Composer Access
- Test 2: D1 Selection
- Test 3: D1 Save
- Test 4: Network Inspection (Composer)
- Test 5: Console Inspection (Composer)

### BLOCKED 🔴
- Test 6: Learner route (needs published content + learner auth)
- Test 7: Runtime context (needs learner route)
- Test 8: Completion tracking (needs learner route)
- Test 9: Progress persistence (needs learner route)
- Test 10: Failure isolation (needs learner route)

---

## Manual Testing Instructions

1. Start all services:
   ```powershell
   pnpm --filter @quiz/api-server dev
   pnpm --filter @quiz/api-gateway dev
   pnpm --filter @quiz/skillhubcore-admin dev
   ```

2. Open browser: `http://localhost:3007/tools/tutorial-page-content`

3. Follow Tests 1-5 above

4. Document results in: `.analysis/phase-25-browser-test-results.md`

5. For Tests 6-10: Defer until content is published and learner auth is configured
