# Tutorial Composer E2E Test - Complete Summary

**Date:** 2026-08-22  
**Issue:** Tutorial Composer Save/Publish 400 Error (UUID Validation)  
**Status:** ✅ RESOLVED & DOCUMENTED

---

## Problem Statement

### Original Issue

When saving a tutorial in Tutorial Composer at `admin.skillhubcore.in`, the operation failed with:

```
HTTP 400 Bad Request
"Invalid uuid" at content.blocks.0.id
```

**Root Cause:**

```javascript
// ❌ WRONG - Generated non-UUID strings
const blockId = `block-definition-d1-${Date.now().toString(36)}`;
// Result: "block-definition-d1-mt4qamix" ← NOT a valid UUID
```

**Why it happened:**

- Block IDs were generated using `Date.now().toString(36)`
- This creates base-36 encoded timestamp strings
- Zod schema validation requires valid UUIDs
- Backend rejected the request at validation layer

---

## Solution Implemented

### 1. Fixed Block ID Generation

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/TutorialPageContentBuilderClient.tsx`

```javascript
// ✅ CORRECT - Generate valid UUIDs
const blockId = crypto.randomUUID();
// Result: "dbc8a35a-3653-4701-8660-419dead0a20e" ← Valid UUID
```

**Commit:** `ee6f812d`

### 2. Resolved Foreign Key Constraints

**Problem:** Tutorial sections FK constraint required internal subtopic ID, but API received external MainDB subtopic ID.

**Architecture:**

```
MainDB (quiz-prod)
  subtopics.id (external)
  12efacf1-b5ad-4b43-9fe4-17ba1cf249e4
        ↓
tutorial_db
  tutorial_subtopics.external_id
        ↓
  tutorial_subtopics.id (internal)
  ba9125f3-12b1-4698-9262-2da3116073a7
        ↓
  tutorial_sections.subtopic_id (FK)
```

**Solution:**

1. **Synced hierarchy** from MainDB to tutorial DB
   - Script: `scripts/sync-java-subtopic-simple.mjs`
   - Mapped: domain → subject → topic → subtopic

2. **Added ID resolution** in repository layer
   - File: `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`
   - Method: `resolveSubtopicId(externalSubtopicId)` → internal ID

3. **Applied resolution** in service layer
   - File: `packages/db-tutorial/src/services/tutorial-composer.service.ts`
   - Methods: `createTutorial()`, `queryTutorials()`
   - All CRUD operations resolve external → internal ID before DB operations

### 3. Created Comprehensive E2E Test

**File:** `scripts/test-tutorial-composer-e2e.mjs`

**Tests 10 scenarios:**

```
✅ 01. Login                        - Admin authentication
✅ 02. Validate Test Subtopic       - Verify data prerequisites
✅ 03. Create D1 with Valid UUID    - POST with crypto.randomUUID()
✅ 04. Read After Create            - GET verify single block
✅ 05. Update with Multiple Blocks  - PATCH with 5 blocks
✅ 06. Read 5-Block Document        - Verify persistence
✅ 07. Publish Tutorial             - POST publish endpoint
✅ 08. Read Published Tutorial      - Verify status=deployed
✅ 09. Invalid UUID Rejection       - Regression test (400 error)
✅ 10. Valid UUID Acceptance        - Regression test (no UUID error)
```

**Key Features:**

- **Proper UPDATE**: Uses PATCH endpoint (not duplicate POST)
- **Multi-block persistence**: Verifies 5 blocks persist through UPDATE → PUBLISH cycle
- **UUID validation**: Protects against regression
- **Comprehensive logging**: Timestamps, request/response details
- **Error diagnostics**: Specific messages for 500, FK violations, etc.

**Commit:** `a4e9ad42`

---

## How to Run E2E Test

### Prerequisites

```bash
# 1. Environment variables in .env.local
TEST_BASE_URL=http://localhost:3007
ADMIN_EMAIL=admin@skillhubcore.in
ADMIN_PASSWORD=testing
TEST_SUBTOPIC_ID=12efacf1-b5ad-4b43-9fe4-17ba1cf249e4

# 2. Database accessible
psql $DATABASE_URL -c "SELECT 1;"

# 3. Test subtopic exists in MainDB
psql $DATABASE_URL -c "SELECT id, name FROM subtopics WHERE id='12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';"
```

### Execution

```bash
# Terminal 1: Start server
npm run dev
# Wait for: ✓ Ready in X.Xs
# Look for: ○ Local: http://localhost:3007

# Terminal 2: Run E2E test
node scripts/test-tutorial-composer-e2e.mjs
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║         TUTORIAL COMPOSER E2E INTEGRATION TEST            ║
╚═══════════════════════════════════════════════════════════╝

Base URL: http://localhost:3007
Admin Email: admin@skillhubcore.in
Test Subtopic: 12efacf1-b5ad-4b43-9fe4-17ba1cf249e4
Brand: shared

════════════════════════════════════════════════════════════

✅ [PASS] Login
✅ [PASS] Validate Test Subtopic
✅ [PASS] Create D1 with Valid UUID
✅ [PASS] Read After Create
✅ [PASS] Update with Multiple Blocks
✅ [PASS] Read 5-Block Document
✅ [PASS] Publish Tutorial
✅ [PASS] Read Published Tutorial
✅ [PASS] Invalid UUID Rejection
✅ [PASS] Valid UUID Acceptance

════════════════════════════════════════════════════════════
FINAL REPORT
════════════════════════════════════════════════════════════

✅ PASSED: 10
❌ FAILED: 0

════════════════════════════════════════════════════════════

✅ ALL TESTS PASSED

Safe to proceed with:
  1. npm run type-check
  2. npm run build
  3. git commit
  4. deploy
```

---

## Verification Checklist

### ✅ Architecture Proven

| Operation | Status | Evidence |
|-----------|--------|----------|
| CREATE | ✅ Working | External→Internal ID resolution, 201 success |
| READ | ✅ Working | External→Internal ID resolution, data returned |
| UPDATE | ✅ Working | PATCH endpoint, 5-block persistence, version++ |
| PUBLISH | ✅ Working | Status → deployed, publishedAt timestamp |
| UUID Validation | ✅ Working | Invalid rejected (400), Valid accepted |

### ✅ Type-Check

```bash
npm run type-check
# Tasks: 28 successful, 28 total
# ✅ PASSED
```

### ✅ Code Changes

```bash
# 1. Block ID generation fix
apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/TutorialPageContentBuilderClient.tsx

# 2. ID resolution in repository
packages/db-tutorial/src/repositories/tutorial-section.repository.ts

# 3. ID resolution in service
packages/db-tutorial/src/services/tutorial-composer.service.ts

# 4. E2E test
scripts/test-tutorial-composer-e2e.mjs

# 5. Hierarchy sync script
scripts/sync-java-subtopic-simple.mjs
```

### ✅ Git Commits

```bash
ee6f812d - Fix: Use crypto.randomUUID() for block IDs
[sync]   - Synced Java hierarchy to tutorial DB
[service]- Added resolveSubtopicId() resolution
a4e9ad42 - test: Complete E2E with proper PATCH update, Publish
5e723638 - docs: Complete E2E testing guide and quick reference
```

---

## Documentation Created

### 1. E2E Testing Guide

**File:** `docs/testing/e2e-testing-guide.md`

**Contents:**
- Complete E2E testing process
- Server setup instructions (single app, turborepo, PM2)
- Test script template (reusable for new features)
- Best practices (isolation, assertions, logging, error handling)
- Troubleshooting common issues
- Tutorial Composer E2E as reference implementation

**Use Cases:**
- Template for writing new E2E tests
- Onboarding new developers
- Setting up CI/CD pipelines
- Production readiness verification

### 2. Quick Reference Card

**File:** `docs/testing/e2e-quick-reference.md`

**Contents:**
- 3-step quick start guide
- Common commands cheat sheet
- Environment variables reference
- Error patterns and solutions
- Pre-deployment checklist

**Use Cases:**
- Fast lookup during development
- CI/CD script reference
- Troubleshooting guide

### 3. This Summary Document

**File:** `docs/testing/tutorial-composer-e2e-summary.md`

**Contents:**
- Complete problem → solution narrative
- Architecture decisions
- How to run the test
- Verification checklist
- Future reference

---

## Key Learnings

### 1. UUID Validation is Critical

**Lesson:** Backend validation schemas (Zod) enforce data types strictly.

**Solution:** Use proper UUID generation (`crypto.randomUUID()`) instead of timestamps or sequential IDs.

**Prevention:** E2E test includes regression check for UUID validation.

### 2. E2E Tests > Unit Tests for Integration Issues

**Why:**
- Unit tests wouldn't catch the FK constraint issue
- Unit tests wouldn't verify external→internal ID resolution
- Unit tests wouldn't prove multi-block persistence through publish

**E2E proves:**
- Entire request/response cycle works
- Database constraints are satisfied
- State transitions persist correctly

### 3. Proper HTTP Methods Matter

**Wrong:**

```javascript
// Test UPDATE by creating duplicate (gets 409)
POST /api/resources
POST /api/resources  // ❌ Conflict error
```

**Right:**

```javascript
// Test UPDATE using proper endpoint
POST /api/resources     // Create
PATCH /api/resources/id // Update ✅
```

### 4. Test Data Must Mirror Production

**Wrong:**

```javascript
const payload = { title: 'Test' }; // Minimal test data
```

**Right:**

```javascript
const JAVA_DEFINITION_PAYLOAD = {
  page: {
    type: 'definition',
    category: 'Java',
    title: 'What Is Java?',
    intro: '...',
    definition: '...',
    explanation: [...],
    example: { language: 'java', code: '...' },
    characteristics: [...],
    takeaway: '...'
  }
};
// ✅ Complete realistic payload from production
```

---

## Future Enhancements

### 1. CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: npm run db:push
      
      - name: Start server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3007
      
      - name: Run E2E tests
        run: node scripts/test-tutorial-composer-e2e.mjs
```

### 2. Parallel Test Execution

```javascript
// Run independent tests in parallel
await Promise.all([
  test09_invalidUUIDRegression(),
  test10_validUUIDRegression(),
  test11_unauthorizedAccess(),
]);
```

### 3. Test Data Fixtures

```javascript
// scripts/test-data/fixtures.mjs
export const fixtures = {
  javaDefinition: { /* ... */ },
  pythonDefinition: { /* ... */ },
  invalidPayloads: { /* ... */ },
};

// Use in tests
import { fixtures } from './test-data/fixtures.mjs';
const payload = fixtures.javaDefinition;
```

### 4. Video Recording (Playwright/Puppeteer)

```javascript
// Optional: Record browser interactions for debugging
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  recordVideo: { dir: 'test-videos/' }
});
```

---

## Deployment Readiness

### ✅ Pre-Deployment Checklist

- [x] All E2E tests passing (10/10)
- [x] Type-check passing (28/28 packages)
- [x] No TypeScript errors
- [x] Git commits clean and descriptive
- [x] Documentation complete
- [x] No console errors in server logs
- [x] Database migrations applied (if any)
- [x] Environment variables documented

### 🔄 Next Steps

1. **Deploy to staging**
   ```bash
   npm run build
   npm run deploy:staging
   ```

2. **Run E2E against staging**
   ```bash
   TEST_BASE_URL=https://staging.skillhubcore.in node scripts/test-tutorial-composer-e2e.mjs
   ```

3. **Smoke test in staging UI**
   - Login to admin panel
   - Navigate to Tutorial Composer
   - Create tutorial with Java Definition
   - Add 5 blocks
   - Save
   - Publish
   - Verify on frontend

4. **Deploy to production**
   ```bash
   npm run deploy:production
   ```

5. **Production smoke test**
   - Same steps as staging
   - Monitor error logs
   - Check database queries

---

## References

### Files

| File | Purpose |
|------|---------|
| `scripts/test-tutorial-composer-e2e.mjs` | E2E test implementation |
| `docs/testing/e2e-testing-guide.md` | Complete testing guide |
| `docs/testing/e2e-quick-reference.md` | Quick reference card |
| `docs/testing/tutorial-composer-e2e-summary.md` | This document |

### Git Commits

```bash
# View full history
git log --oneline --grep="tutorial\|e2e\|uuid"

# View specific commit
git show ee6f812d  # UUID fix
git show a4e9ad42  # E2E test
git show 5e723638  # Documentation
```

### Related Issues

- Original bug report: Tutorial Composer 400 error
- UUID validation schema: Zod schema in validation package
- FK constraint: tutorial_sections.subtopic_id references tutorial_subtopics.id
- External ID mapping: MainDB subtopics → tutorial_subtopics.external_id

---

## Contact

**Questions about this E2E test?**

1. Read: `docs/testing/e2e-testing-guide.md`
2. Check: `docs/testing/e2e-quick-reference.md`
3. Review: `scripts/test-tutorial-composer-e2e.mjs`
4. Ask: #engineering channel

**Found a bug?**

1. Run E2E test locally
2. Check server logs for errors
3. Review git commits for recent changes
4. Create issue with test output

---

**Last Updated:** 2026-08-22  
**Maintained By:** Engineering Team  
**Status:** ✅ Production Ready
