# Mandatory Corrections to the Corrective O1 Remediation Workflow

**Status:** EXECUTION APPROVED IN PRINCIPLE - Subject to these mandatory controls

**Date:** 2026-10-30

The corrective workflow structure is substantially better than the previous attempt and addresses the major failures. However, execution is NOT approved until these technical and procedural corrections are applied.

---

## 1. Complete Contract Discovery (Phase 1)

### REQUIREMENT: Trace Complete Data Transformation

Phase 1 must trace the ENTIRE O1 data path through ALL transformation boundaries:

1. **Registry default payload creation** - `objective.registry.ts:getDefaultPayload()`
2. **Composer block insertion** - How UI creates initial block
3. **canonicalizeBlockInstance()** - `blockVersionDefinitions.ts`
4. **toTutorialBlock()** or equivalent adapter - Document serialization
5. **Document serialization** - What gets sent to API
6. **Save API validation** - Which schema validates the request
7. **Database persistence** - What gets stored in PostgreSQL
8. **GET response normalization** - What API returns
9. **Composer hydration** - How UI reconstructs block
10. **Learner renderer input** - What `ObjectiveO1Block.tsx` receives

### Evidence Required

For EACH transformation boundary:
- **File path** (absolute)
- **Line numbers** (exact)
- **Code quote** (direct from source)
- **Input shape** (what goes in)
- **Output shape** (what comes out)
- **Representative runtime payload** (if available)

### Critical Files to Inspect

**MUST read ALL:**
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/blockVersionDefinitions.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/useTutorialBlockEditor.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/tutorialSaveService.ts`
- `apps/skillhubcore-admin/src/app/(api)/tutorial-composer/sections/[id]/route.ts`
- `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`
- `packages/ui/src/tutorial/blocks/objective/ObjectiveO1Block.tsx`

### PROHIBITED Assumptions

❌ Do NOT assume intermediate Composer object = persisted document shape  
❌ Do NOT invent `content.page` wrapping unless code proves it exists  
❌ Do NOT require `text` field unless renderer actually uses it  
❌ Do NOT assume registry default = API payload without verification  

### Approval Gate

**No parallel implementation agents may start until:**
- Contract document reviewed and approved by human
- All 10 transformations documented with code evidence
- No unverified assumptions

---

## 2. Verify Lifecycle API Contracts Before Testing (Phase 6)

### REQUIREMENT: Inspect Actual Route Implementations

Before writing lifecycle test scripts, Phase 6 agent MUST inspect:

**Route handlers:**
- `apps/skillhubcore-admin/src/app/(api)/tutorial-composer/sections/route.ts` (POST)
- `apps/skillhubcore-admin/src/app/(api)/tutorial-composer/sections/[id]/route.ts` (PATCH, GET)
- `apps/skillhubcore-admin/src/app/(api)/tutorial-composer/sections/[id]/publish/route.ts` (POST)

**Verify:**
- Actual endpoint paths
- Request schema validation
- Response structure
- Authentication middleware
- Authorization checks
- Error response formats

### PROHIBITED Assumptions

❌ Do NOT assume endpoint paths without verification  
❌ Do NOT assume request/response property names  
❌ Do NOT assume authentication mechanism  
❌ Do NOT create new API assumptions to make tests run  

### Required Evidence

Document:
- Actual endpoint paths (from route files)
- Request body schema (from validation code)
- Response body structure (from route return statements)
- Authentication method (from middleware inspection)
- Expected error codes and formats

---

## 3. Mandatory Database Isolation (Phase 6)

### CRITICAL SAFETY REQUIREMENT

**NEVER execute lifecycle tests, migrations, or destructive operations against production.**

Earlier test evidence showed integration tests connecting to a Neon database named `tutorial_prod`. This is PROHIBITED.

### Required Controls

**Before ANY lifecycle testing:**

1. ✅ **Verify test database connection**
   ```bash
   echo $DATABASE_URL
   # MUST contain 'test' or 'dev', NEVER 'prod'
   ```

2. ✅ **Confirm database identity**
   ```sql
   SELECT current_database();
   -- MUST NOT be tutorial_prod
   ```

3. ✅ **Use test-only records**
   - Create isolated tutorial
   - Create isolated section
   - Use test user account

4. ✅ **Cleanup after testing**
   - Delete test records
   - Restore test database to clean state

5. ✅ **Redact secrets**
   - Never log authentication tokens
   - Never commit credentials
   - Redact sensitive data from evidence

### Failure Mode

**If isolated test database is unavailable:**
- Status: **BLOCKED** (not "NOT VERIFIED")
- Do NOT substitute production
- Do NOT proceed with lifecycle tests
- Document: "Lifecycle gate BLOCKED - no test database available"

### Evidence Required

- Database connection string (with credentials redacted)
- Database name verification
- Test record IDs used
- Cleanup confirmation

---

## 4. Complete Test-Suite Evidence (Phase 4, Phase 5)

### REQUIREMENT: Report Full Test Execution

**Do NOT use fixed test count as sole acceptance criterion.**

A result like "23/23 passing" is meaningless if:
- Suite collected 107 tests but only 23 were selected
- Tests were skipped due to environment issues
- Suite was interrupted before completion

### Required Reporting

**For EVERY test suite execution:**

```
Collected: X tests
Passed: Y tests
Failed: Z tests
Skipped: N tests
Deselected: M tests
Interrupted: YES/NO
Exit code: N
```

### Phase 4 Specific Requirements

**Placement tests MUST include:**
- Both previously failing patcher cases (`patch_tutorial_block_renderer`, `patch_generated_block_version_definitions`)
- Idempotency tests with realistic source files
- Regression tests for existing block families (I1, C1, D1, S1)
- Complete placement test suite (not subset)

**Command:**
```bash
pytest services/project-ai/tests/test_file_operations_placement.py -v --tb=short
```

**Acceptance:**
- Exit code: 0
- No unexpected skips
- No unexpected failures
- Both patcher defects verified fixed

### Phase 5 Specific Requirements

**TypeScript compilation MUST be verified separately from tests:**

```bash
# 1. Compilation check
cd packages/types
npx tsc --noEmit -p tsconfig.json
echo "Exit code: $?"  # MUST be 0

# 2. Test execution
npm test --workspace=@quiz/types -- --run
```

**Do NOT report successful tests as proof of successful compilation.**

---

## 5. TypeScript Package Verification (Phase 5)

### REQUIREMENT: Inspect Before Modifying

**Before modifying barrel exports:**

1. Read existing `packages/types/src/tutorial-rich-document/index.ts`
2. Read existing `packages/types/src/tutorial-rich-document/blocks/index.ts`
3. Read existing `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
4. Understand current export patterns
5. Identify barrel export conventions

### PROHIBITED Actions

❌ Do NOT blindly copy example code from workflow instructions  
❌ Do NOT create duplicate exports  
❌ Do NOT introduce circular dependencies  
❌ Do NOT modify unrelated exports  

### Required Verification

**After modifications:**

```bash
# 1. Verify compilation
cd packages/types
npx tsc --noEmit -p tsconfig.json

# 2. Verify tests
npm test

# 3. Verify no circular dependencies
npm run lint  # If circular dependency check exists
```

### Evidence Required

- TypeScript compilation output (full log)
- Test execution output (collected/passed/failed counts)
- Exit codes for all commands

---

## 6. Agent Ownership and Integration Boundaries

### Explicit Ownership Assignment

| Agent | Responsibility | Files Modified | Dependencies |
|-------|----------------|----------------|--------------|
| **wf-design** | Contract discovery only | Documentation only | None |
| **Agent 2A** | O1 schema and candidate | `objective-o1.schema.ts`, tests | Phase 1 contract |
| **Agent 2B** | Comparator validation | `comparator.py`, tests | Phase 1 contract |
| **Agent 2C** | Patcher bug fixes | `patcher.py`, tests | None (parallel) |
| **wf-coder** | Integration, TypeScript, lifecycle | Multiple | Phases 2A/2B/2C complete |
| **wf-code-reviewer** | Independent review | None (read-only) | All phases complete |

### Rules

1. **All agents follow approved Phase 1 contract**
   - No agent may independently redefine O1 structure
   - No agent may invent fields not in contract
   - Schema must match ACTUAL Composer output

2. **No file conflicts**
   - Each file has exactly ONE implementation owner
   - Parallel agents work on different files
   - Integration agent combines approved changes

3. **Architectural boundary**
   - **Project AI agents:** Prepare candidate changes in controlled workspace
   - **Project LLM:** Owns shared repository placement, registration, rendering integration, certification
   - **Human:** Final approval for gated changes and merge

---

## 7. Evidence-Based Final Verdict (Final Review)

### REQUIREMENT: Independent Verification

The final reviewer MUST independently verify EVERY acceptance criterion.

### Status Taxonomy

**Use ONLY these statuses:**

- ✅ **PASS** - Directly verified with reproducible evidence
- ❌ **FAIL** - Test or required behavior failed
- 🚫 **BLOCKED** - Required environment or dependency unavailable
- ⏸️ **NOT RUN** - Check was not executed

### PROHIBITED Equivalences

❌ "NOT VERIFIED" ≠ PASS  
❌ "BLOCKED" ≠ PASS  
❌ "NOT RUN" ≠ PASS  
❌ "Partially executed" ≠ PASS  
❌ "Interrupted" ≠ PASS  

### Merge Approval Rule

**"READY FOR MERGE" is permitted ONLY when:**

✅ ALL mandatory acceptance criteria have PASS evidence  
✅ NO criteria are BLOCKED, FAILED, or NOT RUN  
✅ All evidence is reproducible  
✅ All HTTP logs captured  
✅ All database queries documented  
✅ All test results recorded  

### PROHIBITED Actions Without Approval

❌ Do NOT modify main branch  
❌ Do NOT merge feature branch  
❌ Do NOT push to production  
❌ Do NOT deploy  
❌ Do NOT certify as production-ready  
❌ Do NOT bypass approval gates  

---

## 8. Authentication and Security Controls (Phase 6)

### REQUIREMENT: Secure Credential Handling

**Do NOT extract tokens from .env.local casually.**

### Required Approach

1. **Verify authentication mechanism**
   - Inspect middleware in route files
   - Understand session/token strategy
   - Use supported login flow

2. **Secure credential storage**
   - Store credentials in secure environment
   - Never commit tokens to git
   - Never log full tokens in evidence
   - Redact sensitive data

3. **Token redaction in evidence**
   ```
   Authorization: Bearer eyJhbG...  # ✅ First 6 chars only
   Authorization: Bearer ***REDACTED***  # ✅ Acceptable
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ❌ NEVER
   ```

### Evidence Format

**HTTP Request (redacted):**
```http
PATCH /api/tutorial-composer/sections/abc123
Authorization: Bearer ***REDACTED***
Content-Type: application/json

{
  "content": { ... }
}
```

**HTTP Response (redacted):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "updatedAt": "2026-10-30T..."
  }
}
```

---

## 9. Lifecycle Evidence Requirements (Phase 6)

### REQUIREMENT: Reproducible Evidence

**Manual browser checks are acceptable initially, but evidence must be documented.**

### Final Evidence Report Must Include

**Environment:**
- Git branch and commit SHA
- Database name and connection (credentials redacted)
- Server URL
- Test record IDs

**Test Execution:**
- Exact commands executed
- Exit codes
- Full command output (with secrets redacted)

**Save Operation:**
- HTTP request (redacted)
- HTTP response
- Status code (200, 400, 401, etc.)
- Response body
- If 400: Full validation error details

**GET Reload:**
- HTTP request (redacted)
- HTTP response
- Block comparison (saved vs retrieved)
- Verification: ID, type, version, content match

**UI Hydration:**
- URL accessed
- Browser console logs
- Screenshots (if possible)
- Manual verification checklist

**Publish:**
- HTTP request (redacted)
- HTTP response
- Status code
- Published state confirmation

**Learner Rendering:**
- URL accessed
- Visual confirmation
- Console logs
- Screenshots (if possible)

**Known Limitations:**
- Any skipped steps with reasons
- Any BLOCKED steps with reasons
- Any manual checks that couldn't be automated

### PROHIBITED Claims

❌ "Step passed" - without verification evidence  
❌ "Command executed" - without checking expected behavior  
❌ "Likely works" - without actual test  
❌ "Should be fine" - without verification  

---

## 10. Documentation Standards

### Update Existing Documents

**Prefer updating existing documents over creating duplicates:**
- Phase 1 contract → Update if contract refinement needed
- Phase reviews → Update existing phase reports
- Final verdict → Update existing merge-readiness report

### Evidence Organization

**Artifact directory structure:**
```
.agents/tasks/corrective-remediation-o1-schema/
├── MANDATORY-HARDENING-CONTROLS.md (this file)
├── phase1-actual-contract.md (complete transformation trace)
├── phase2-schema-fix-evidence.md
├── phase3-validation-evidence.md
├── phase4-patcher-fix-evidence.md
├── phase5-typescript-evidence.md
├── phase6-lifecycle-evidence.md
├── final-review.md
└── final-verdict.json
```

---

## Final Checklist for Human Approval

Before approving merge, verify:

- [ ] Phase 1 contract documents ALL 10 transformations
- [ ] Phase 1 contract has code evidence (file, lines, quotes)
- [ ] Phase 2 schema validates ACTUAL Composer output
- [ ] Phase 2 schema validates ACTUAL registry default
- [ ] Phase 3 schemaExport is MANDATORY (not conditional)
- [ ] Phase 3 interface-only files REJECTED
- [ ] Phase 4 ALL placement tests PASS (complete suite)
- [ ] Phase 4 double-comma bugs FIXED (idempotency verified)
- [ ] Phase 5 TypeScript compilation PASSES (exit 0)
- [ ] Phase 5 TypeScript tests PASS (complete suite)
- [ ] Phase 6 test database verified (NOT production)
- [ ] Phase 6 Save returned 200 (not 400)
- [ ] Phase 6 GET retrieved same block
- [ ] Phase 6 Publish succeeded
- [ ] Phase 6 Learner rendered O1
- [ ] All evidence captured with HTTP logs
- [ ] All secrets redacted from evidence
- [ ] Final review verified ALL criteria
- [ ] Final verdict is PASS for all (no BLOCKED, FAIL, NOT RUN)

**Only when ALL boxes checked: APPROVE MERGE**

---

**Execution Status:** PAUSED - Awaiting Phase 1 contract review before continuing to parallel fixes

**Next Action:** Review Phase 1 contract document when complete, verify ALL 10 transformations documented, then approve continuation to parallel fixes.
