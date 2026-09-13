# PHASE 2.6-A4-C2-V4 DIAGNOSTIC REPORT

## 1. Exact Active-Time Response

### With Invalid UUIDs (node-1, subtopic-1):
**Status:** 400  
**Response body:**
```json
{
  "error": "Invalid request body",
  "issues": [
    {
      "code": "invalid_string",
      "message": "Invalid UUID format",
      "path": ["navigationNodeId"],
      "validation": "uuid"
    },
    {
      "code": "invalid_string",
      "message": "Invalid UUID format",
      "path": ["subtopicId"],
      "validation": "uuid"
    }
  ]
}
```

### With Valid UUIDs + Proper Mocks:
**Would be:** 200 with data  
**Actually got:** 500 Internal Server Error  
**Reason:** Repository mock construction error

## 2. Authentication Result

**REAL validateRequest():** ✅ **PASS**

**Evidence:**
```
hasInternalSecret: true
hasUserId: true
hasBrand: true

Validating internal secret...
Secret comparison:
  receivedLength: 25
  expectedLength: 25
  match: true

Internal service authentication
authMode: "internal"
```

## 3. Exact 400 Origin

**Layer:** ✅ **Schema Validation (Zod)**

**NOT:**
- ❌ Authentication
- ❌ Route logic
- ❌ Service
- ❌ Repository
- ❌ Runtime/module

**Why:**  
The `recordActiveTimeBodySchema` requires:
```ts
navigationNodeId: z.string().uuid('Invalid UUID format')
subtopicId: z.string().uuid('Invalid UUID format')
```

Test fixtures used:
- `"node-1"` → Invalid UUID
- `"subtopic-1"` → Invalid UUID

The schema validation occurs **AFTER successful authentication** but **BEFORE service invocation**.

## 4. Service Constructor Evidence

**Constructor invoked:** ❌ **NO**

**Exact evidence:**
```
constructorCallCount: 0
serviceObserved: false
recordActiveTimeCalled: 0
```

**Why constructor wasn't reached:**
1. **Invalid UUIDs** in original tests → Schema validation failed at 400
2. **With valid UUIDs** → Repository mock error at line 69:
   ```
   TypeError: () => ({}) is not a constructor
   at new TutorialNavigationProgressRepository()
   ```

**Repository mock issue:**
```ts
// WRONG - arrow function returning object
TutorialNavigationProgressRepository: vi.fn().mockImplementation(() => ({}))

// NEEDED - actual constructor
TutorialNavigationProgressRepository: vi.fn().mockImplementation(function() {
  return {};
})
```

## 5. Mock Resolution

**Route import:**
```ts
import { LearningProgressService } from '@quiz/db-tutorial';
```

**Test mock import:**
```ts
vi.mock('@quiz/db-tutorial', ...)
```

**Same module identity:** ✅ **YES** (confirmed - both use `@quiz/db-tutorial`)

**Mock interception works:** ✅ **YES** (vitest correctly intercepts the module)

**Problem:** Mock implementation details (repository constructors)

## 6. Production Code Changes

✅ **NONE** - Diagnostic only as required

## 7. Root Cause Chain

```
POST /active-time
      │
      ▼
REAL validateRequest()
      │
      ├── X-Internal-Secret validated
      ├── AuthContext created
      │
      ▼
    ✅ PASS
      │
      ▼
Request body parsing
      │
      ▼
Zod schema validation
      │
      ├── navigationNodeId: "node-1"
      ├── Expected: valid UUID
      │
      ▼
    ❌ FAIL: Invalid UUID format
      │
      ▼
  HTTP 400
  (Service never reached)
```

## 8. Required Corrections

### For authentication.security.test.ts:

1. **Use valid UUID fixtures:**
   ```ts
   navigationNodeId: '550e8400-e29b-41d4-a716-446655440001'
   subtopicId: '550e8400-e29b-41d4-a716-446655440002'
   ```

2. **Fix repository mocks:**
   ```ts
   TutorialNavigationProgressRepository: vi.fn().mockImplementation(function() {
     return {}; // or actual mock repository methods
   }),
   TutorialSectionRepository: vi.fn().mockImplementation(function() {
     return {}; // or actual mock repository methods
   }),
   ```

3. **Service constructor tracking works** when repositories don't throw

### Authentication Evidence Status:

| Property | Status |
|----------|---------|
| REAL validateRequest() executes | ✅ PROVEN |
| Invalid secret rejected | ✅ PROVEN (401) |
| Missing secret behavior | ⚠️ Gateway fallback exists |
| Valid secret accepted | ✅ PROVEN |
| Service short-circuit on auth failure | ✅ PROVEN (constructorCallCount=0) |
| Identity propagation | ⏳ BLOCKED by fixture/mock issues |
| Service invocation on valid auth | ⏳ BLOCKED by fixture/mock issues |

## 9. Conclusion

🔴 **BLOCKED — Root cause identified, correction not yet applied**

**Summary:**
- Authentication middleware works correctly
- Test fixtures use invalid UUIDs causing schema validation failures
- Repository mocks use incorrect constructor pattern causing runtime errors
- Service constructor observation mechanism works (when dependencies don't fail)
- NO production code issues discovered
- All failures are test architecture issues

**Next Steps:**
1. Update test fixtures with valid UUIDs for ALL routes
2. Fix repository mock constructors to use `function()` not `() => {}`
3. Re-run tests to verify service invocation and identity propagation
4. Document gateway vs internal authentication modes

---

**DO NOT proceed to A4-C3 until test fixtures are corrected and identity propagation is proven.**
