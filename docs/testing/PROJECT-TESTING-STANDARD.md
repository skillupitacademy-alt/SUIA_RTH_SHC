# Project Testing Standard

**Status:** ✅ ACTIVE  
**Effective Date:** 2026-08-22  
**Authority:** Engineering Team  
**Applies To:** All backend/API/database changes

---

## Mandatory Rule

> **No meaningful backend/API/database feature is considered deployment-ready until its Node.js E2E integration test passes locally, followed by type-check and build.**

This is **not optional**. This is the **project standard**.

---

## Standard Workflow

### Step-by-Step

```
1. Developer makes code changes
        ↓
2. Run type-check
   npm run type-check
        ↓
3. Start local application (Terminal 1)
   npm run dev
        ↓
4. Run Node.js E2E script (Terminal 2)
   node scripts/test-<feature>-e2e.mjs
        ↓
5. Verify complete business workflow
   - Real HTTP requests
   - Real authentication
   - Real API
   - Real database
   - Real business logic
        ↓
6. Check results
   ✅ ALL TESTS PASSED
        ↓
7. Build
   npm run build
        ↓
8. Commit
   git commit -m "feat: ..."
        ↓
9. Deploy
```

### If E2E Fails

```
❌ TEST SUITE FAILED

DO NOT DEPLOY until all tests pass.

Required actions:
1. Read test failure output
2. Check server logs
3. Investigate root cause
4. Fix the issue
5. Re-run type-check
6. Re-run E2E test
7. Only deploy when ALL TESTS PASSED
```

---

## Technology: Node.js + Fetch API

### What We Use

**Node.js E2E integration scripts with real HTTP requests via `fetch()`**

```javascript
// Example from scripts/test-tutorial-composer-e2e.mjs
const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `accessToken=${adminToken}`,
  },
  body: JSON.stringify(payload),
});

const result = await response.json();

// Real HTTP request
// Real authentication (session cookie)
// Real API endpoint
// Real database transaction
// Real business logic
```

### What We Don't Use

- ❌ **Playwright** (browser automation)
- ❌ **Puppeteer** (headless Chrome)
- ❌ **Cypress** (browser E2E testing)
- ❌ **Selenium** (UI testing)

### Why Node.js + Fetch?

| Reason | Benefit |
|--------|---------|
| **Backend focus** | Tests API → Service → Database flow |
| **Speed** | No browser overhead, faster execution |
| **Debugging** | Standard Node.js debugging tools |
| **CI/CD** | No browser dependencies needed |
| **Real integration** | Actual HTTP requests to actual endpoints |
| **Business logic** | Tests what matters: backend workflows |

### When to Use Browser Testing

Browser testing (Playwright/Cypress) is appropriate for:

- UI/UX validation
- Frontend-only bugs
- Cross-browser compatibility
- Visual regression testing
- User interaction flows (clicks, forms, navigation)

**This project's E2E testing focuses on backend/API workflows**, so we use Node.js + fetch().

---

## Business Lifecycle Principle

### Core Principle

> **E2E tests must follow the actual business lifecycle of the feature, not blindly follow CRUD.**

### ❌ Wrong Approach

```javascript
// Forcing generic CRUD on every feature
await testCreate();
await testRead();
await testUpdate();
await testDelete();  // May not be part of business workflow!
```

### ✅ Right Approach

```javascript
// Tutorial Composer: Actual business lifecycle
await test01_login();                    // Authentication
await test02_validateSubtopic();         // Prerequisites
await test03_createD1();                 // Create
await test04_readAfterCreate();          // Verify creation
await test05_updateWithMultipleBlocks(); // Update (real workflow)
await test06_read5BlockDocument();       // Verify persistence
await test07_publishTutorial();          // Publish (business operation)
await test08_readPublishedTutorial();    // Verify published state
await test09_invalidUUIDRegression();    // Protect against known bugs
await test10_validUUIDRegression();      // Regression tests

// Note: No DELETE test - not part of Tutorial Composer workflow
// Cleanup happens in test02 (prerequisite validation)
```

### Examples by Feature

#### Tutorial Composer

```
Authentication
    ↓
Prerequisite validation
    ↓
Create tutorial
    ↓
Read (verify)
    ↓
Update with 5 blocks
    ↓
Read (verify persistence)
    ↓
Publish
    ↓
Read published
    ↓
Regression tests (UUID validation)
```

#### Quiz Management (hypothetical)

```
Authentication
    ↓
Create quiz
    ↓
Add questions (multi-step)
    ↓
Read quiz
    ↓
Update settings
    ↓
Publish quiz
    ↓
Archive quiz (not delete)
    ↓
Delete quiz (final cleanup)
```

#### User Management (hypothetical)

```
Authentication
    ↓
Create user
    ↓
Read user
    ↓
Update profile
    ↓
Deactivate (not delete)
    ↓
Reactivate
    ↓
Read (verify active)
```

#### Payment Flow (hypothetical)

```
Authentication
    ↓
Initiate payment
    ↓
Verify amount
    ↓
Process payment
    ↓
Confirm transaction
    ↓
Read receipt
    ↓
Refund (if needed)
```

### Key Insight

**Different features have different lifecycles. Test what users actually do, not what databases theoretically support.**

---

## What Qualifies as "Meaningful Change"

E2E testing is **mandatory** for:

### Backend Changes

- ✅ API endpoint added/modified
- ✅ Service layer logic changed
- ✅ Repository/database query changed
- ✅ Database schema migration
- ✅ Authentication/authorization logic
- ✅ Business workflow changed
- ✅ Data validation rules changed
- ✅ Foreign key constraints added/modified
- ✅ Multi-step transactions

### Frontend Changes (API-dependent)

- ✅ Form submission that calls API
- ✅ Data mutation that persists to database
- ✅ User workflow that spans multiple API calls

### Infrastructure Changes

- ✅ Database connection pooling
- ✅ Caching layer added/changed
- ✅ Rate limiting implemented
- ✅ Session management changed

---

## Why This Standard Exists

### The Tutorial Composer Incident

This standard emerged from a real production incident:

```
Problem:
  Tutorial Composer Save/Publish failed with 400 error

Initial Diagnosis:
  "Invalid UUID" validation error

Investigation Revealed:
  1. Block IDs generated with Date.now().toString(36)
  2. Not valid UUIDs
  3. Also FK constraint violation (external vs internal ID)
  4. Service layer needed ID resolution
  5. READ also needed resolution
  6. UPDATE should use PATCH not duplicate POST
  7. Publish endpoint needed testing

Root Cause:
  No E2E test existed to catch these integration issues

Resolution:
  1. Fixed UUID generation: crypto.randomUUID()
  2. Added ID resolution in service layer
  3. Created comprehensive 10-test E2E script
  4. All tests passing → deployment ready
```

### What E2E Proved

The E2E test proved what unit tests couldn't:

| Test | What It Proved |
|------|----------------|
| CREATE | External→Internal ID resolution works |
| READ | ID resolution works for queries |
| UPDATE (PATCH) | Multi-block persistence works |
| PUBLISH | Status transition works |
| UUID Regression | Validation protects against known bugs |

**Without E2E, code looked reasonable but had production failures.**

**With E2E, we have proof the entire workflow works.**

---

## Enforcement

### Pre-Commit

```bash
# Before committing backend changes:

# 1. Type-check must pass
npm run type-check

# 2. E2E test must pass
node scripts/test-<feature>-e2e.mjs

# 3. Build must succeed
npm run build

# 4. Then commit
git commit -m "feat: ..."
```

### Code Review

Reviewers must verify:

- [ ] E2E test exists for changed feature
- [ ] E2E test follows business lifecycle
- [ ] E2E test passes in PR description
- [ ] Type-check passes
- [ ] Build succeeds

**If no E2E test exists for a backend change, request it before approving.**

### CI/CD (Future)

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
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Setup database
        run: npm run db:push
      - name: Start server
        run: npm run dev &
      - name: Wait for server
        run: npx wait-on http://localhost:3007
      - name: Run E2E tests
        run: |
          node scripts/test-tutorial-composer-e2e.mjs
          node scripts/test-quiz-e2e.mjs
          # Add more as created
      - name: Type-check
        run: npm run type-check
      - name: Build
        run: npm run build
```

---

## Getting Started

### For New Features

1. **Read the guide**: `docs/testing/e2e-testing-guide.md`
2. **Copy the template**: From guide or `scripts/test-tutorial-composer-e2e.mjs`
3. **Customize for your feature**: Follow business lifecycle
4. **Run locally**: Verify all tests pass
5. **Commit**: Include E2E test with feature code

### For Existing Features

1. **Identify critical workflows**: Login, purchase, publish, etc.
2. **Create E2E test**: One per major workflow
3. **Run before deployment**: Verify nothing broke
4. **Add to CI/CD**: Automate for all PRs

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[Testing README](./README.md)** | Navigation hub |
| **[E2E Testing Guide](./e2e-testing-guide.md)** | Complete guide + template |
| **[Quick Reference](./e2e-quick-reference.md)** | Fast command lookup |
| **[Tutorial Composer Summary](./tutorial-composer-e2e-summary.md)** | Real-world example |
| **This Document** | Project standard (mandatory) |

---

## Reference Implementation

**File:** `scripts/test-tutorial-composer-e2e.mjs`

**Status:** ✅ Production-ready, 10/10 tests passing

**Demonstrates:**
- Node.js + fetch() approach
- Business lifecycle testing (not blind CRUD)
- Real HTTP → API → Database flow
- Authentication
- Multi-step workflows
- Regression protection
- Comprehensive logging
- Cleanup strategy

**Use this as your template for new E2E tests.**

---

## Summary

### The Rule

> **No deployment without passing E2E test.**

### The Technology

> **Node.js + fetch() for backend workflow testing.**

### The Principle

> **Test actual business lifecycle, not theoretical CRUD.**

### The Proof

> **Tutorial Composer: 10/10 tests = deployment confidence.**

---

## Questions?

1. **Read**: [E2E Testing Guide](./e2e-testing-guide.md)
2. **Review**: `scripts/test-tutorial-composer-e2e.mjs`
3. **Run**: `node scripts/test-tutorial-composer-e2e.mjs`
4. **Ask**: #engineering channel

---

**This is the project standard. Follow it.**

**Last Updated:** 2026-08-22  
**Next Review:** 2027-02-22 (6 months)  
**Maintained By:** Engineering Team
