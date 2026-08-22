# End-to-End Testing Guide

Complete guide for running E2E integration tests against local development servers.

---

## Table of Contents

- [Overview](#overview)
- [Development Rule](#development-rule)
- [Technology: Node.js + Fetch API](#technology-nodejs--fetch-api)
- [Prerequisites](#prerequisites)
- [Server Setup](#server-setup)
- [Running E2E Tests](#running-e2e-tests)
- [Test Script Template](#test-script-template)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Example: Tutorial Composer E2E](#example-tutorial-composer-e2e)

---

## Technology: Node.js + Fetch API

**IMPORTANT:** This project uses **Node.js E2E integration scripts**, not Playwright or browser-based testing.

### What We Use

```javascript
// Real HTTP requests via fetch()
const response = await fetch(`${BASE_URL}/api/resources`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `accessToken=${adminToken}`,
  },
  body: JSON.stringify(payload),
});

// Real API endpoints
// Real authentication (session cookies)
// Real database operations
// Real business logic
```

### What We Don't Use

- ❌ Playwright (browser automation)
- ❌ Puppeteer (headless Chrome)
- ❌ Cypress (browser testing)
- ❌ Selenium (UI testing)

### Why Node.js + Fetch?

**Advantages:**
- Tests **backend workflows** directly (API → Service → Database)
- Faster execution (no browser overhead)
- Easier to debug (standard Node.js debugging)
- Better for CI/CD (no browser dependencies)
- Focuses on **business logic** not UI rendering
- Real HTTP requests = real integration testing

**When to use browser testing:**
- UI/UX validation
- Frontend-only bugs
- Cross-browser compatibility
- Visual regression testing
- User interaction flows

**This project focuses on backend/API testing**, so we use Node.js + fetch().

---

## Overview

E2E tests verify the complete lifecycle of features by:

1. Starting local development servers
2. Running test scripts that make real HTTP requests
3. Verifying the **actual business workflow** (not just CRUD)
4. Testing edge cases and error handling
5. Ensuring business logic and data persistence work end-to-end

**Why E2E Tests?**

- Catch integration bugs that unit tests miss
- Verify API contracts work correctly
- Test database constraints and transactions
- Validate authentication and authorization
- Prove complex multi-step workflows

**Project Standard:**

> **No meaningful backend/API/database feature is considered deployment-ready until its Node.js E2E integration test passes locally, followed by type-check and build.**

---

## Development Rule

For **every meaningful backend/API/database change**, follow this workflow:

```
Developer changes code
        ↓
Run type-check
        ↓
Start local application (Terminal 1: npm run dev)
        ↓
Run Node.js E2E script (Terminal 2: node scripts/test-*-e2e.mjs)
        ↓
Real HTTP requests
        ↓
Real authentication
        ↓
Real API
        ↓
Real database
        ↓
Verify complete business workflow
        ↓
ALL TESTS PASSED
        ↓
Build (npm run build)
        ↓
Commit (git commit)
        ↓
Deploy
```

**If E2E fails:**

```
❌ TEST SUITE FAILED

DO NOT DEPLOY until all tests pass.

Fix → Type-check → E2E → Build → Deploy
```

---

## Prerequisites

### Required Tools

```bash
# Node.js 18+ (check version)
node --version

# npm (comes with Node.js)
npm --version

# Environment variables file
.env.local  # Must exist with valid credentials
```

### Required Environment Variables

Create `.env.local` with:

```env
# Server Configuration
PORT=3007                           # Or your app's port
NODE_ENV=development

# Database Connection
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
TUTORIAL_DATABASE_URL=postgresql://user:pass@localhost:5432/tutorial_db

# Authentication
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password

# Test Configuration (optional overrides)
TEST_BASE_URL=http://localhost:3007
TEST_SUBTOPIC_ID=12efacf1-b5ad-4b43-9fe4-17ba1cf249e4
```

---

## Server Setup

### Step 1: Start Development Server

The E2E test requires the application server to be running **before** the test executes.

#### Option A: Single App (e.g., SkillHubCore Admin)

```bash
# Terminal 1 - Start the server
npm run dev

# Wait for server to be ready
# Look for output like:
# ✓ Ready in 2.5s
# ○ Local: http://localhost:3007
```

#### Option B: Multiple Apps (Turborepo)

```bash
# Terminal 1 - Start all apps
npm run dev

# OR start specific app
npm run dev --filter=@quiz/skillhubcore-admin
```

#### Option C: Using PM2 (Production-like)

```bash
# Start server with PM2
npm run start:pm2

# Check status
pm2 status

# View logs
pm2 logs skillhubcore-admin
```

### Step 2: Verify Server is Running

```bash
# Test server health
curl http://localhost:3007/api/health

# Should return 200 OK
```

### Step 3: Verify Database Connection

```bash
# Test database connectivity
npm run db:status

# OR manually via psql
psql $DATABASE_URL -c "SELECT 1;"
```

---

## Running E2E Tests

### Step 1: Ensure Server is Running

```bash
# Check if server is running
curl http://localhost:3007/api/health

# If not running, start it first (see Server Setup above)
npm run dev
```

### Step 2: Run the E2E Test Script

```bash
# Terminal 2 - Run E2E test
node scripts/test-tutorial-composer-e2e.mjs

# OR with npm script (if defined in package.json)
npm run test:e2e:tutorial-composer
```

### Step 3: Review Test Output

```
╔═══════════════════════════════════════════════════════════╗
║         TUTORIAL COMPOSER E2E INTEGRATION TEST            ║
╚═══════════════════════════════════════════════════════════╝

Base URL: http://localhost:3007
Admin Email: admin@skillhubcore.in
Test Subtopic: 12efacf1-b5ad-4b43-9fe4-17ba1cf249e4
Brand: shared

⚠️  Ensure LOCAL server is running: npm run dev

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
   - Login
   - Validate Test Subtopic
   - Create D1 with Valid UUID
   - Read After Create
   - Update with Multiple Blocks
   - Read 5-Block Document
   - Publish Tutorial
   - Read Published Tutorial
   - Invalid UUID Rejection
   - Valid UUID Acceptance

❌ FAILED: 0

════════════════════════════════════════════════════════════

✅ ALL TESTS PASSED

Safe to proceed with:
  1. npm run type-check
  2. npm run build
  3. git commit
  4. deploy
```

### Step 4: If Tests Fail

1. **Check server logs** (Terminal 1) for errors
2. **Review test output** for specific failure details
3. **Check database state** if data-related failure
4. **Verify environment variables** are correct
5. **Re-run specific test** after fixing issue

---

## Test Script Template

Use this as a starting point for new E2E tests.

### File Structure

```
scripts/
  test-<feature>-e2e.mjs          # Main E2E test script
  test-data/                       # Test fixtures (optional)
    sample-payload.json
```

### Template: `scripts/test-feature-e2e.mjs`

```javascript
#!/usr/bin/env node
/**
 * Feature E2E Integration Test
 * 
 * Tests complete lifecycle:
 * - Authentication
 * - CREATE
 * - READ
 * - UPDATE
 * - DELETE
 * - Error cases
 * 
 * Prerequisites:
 * - Start server: npm run dev
 * - Configure .env.local with valid credentials
 * 
 * Run:
 * node scripts/test-feature-e2e.mjs
 */

import 'dotenv/config';

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

// ============================================================
// STATE
// ============================================================

let adminToken = null;
const testResults = {
  passed: [],
  failed: [],
};

// ============================================================
// UTILITIES
// ============================================================

function log(message, data = null) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function pass(testName) {
  console.log(`✅ [PASS] ${testName}`);
  testResults.passed.push(testName);
}

function fail(testName, details) {
  console.error(`❌ [FAIL] ${testName}`);
  console.error(details);
  testResults.failed.push({ test: testName, details });
}

function assert(condition, testName, message) {
  if (!condition) {
    fail(testName, message);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ============================================================
// TEST 01 - LOGIN
// ============================================================

async function test01_login() {
  const testName = 'Login';
  log(`TEST 01: ${testName}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD 
      }),
    });
    
    assert(response.ok, testName, `Login failed: ${response.status}`);
    
    const setCookie = response.headers.get('set-cookie');
    adminToken = setCookie?.match(/accessToken=([^;]+)/)?.[1];
    
    assert(adminToken, testName, 'No access token found');
    
    log(`Authenticated successfully`);
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 02 - CREATE RESOURCE
// ============================================================

async function test02_createResource() {
  const testName = 'Create Resource';
  log(`TEST 02: ${testName}`);
  
  try {
    const payload = {
      name: 'Test Resource',
      description: 'Created by E2E test',
      // ... your payload
    };
    
    const response = await fetch(`${BASE_URL}/api/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    assert(response.ok, testName, `Create failed: ${response.status}`);
    
    const result = await response.json();
    assert(result.data, testName, 'No data in response');
    assert(result.data.id, testName, 'No ID in response');
    
    log(`Resource created:`, { id: result.data.id });
    pass(testName);
    return result.data.id;
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 03 - READ RESOURCE
// ============================================================

async function test03_readResource(resourceId) {
  const testName = 'Read Resource';
  log(`TEST 03: ${testName}`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/resources/${resourceId}`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Read failed: ${response.status}`);
    
    const result = await response.json();
    assert(result.data, testName, 'No data in response');
    assert(result.data.id === resourceId, testName, 'ID mismatch');
    
    log(`Resource read successfully`);
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 04 - UPDATE RESOURCE
// ============================================================

async function test04_updateResource(resourceId) {
  const testName = 'Update Resource';
  log(`TEST 04: ${testName}`);
  
  try {
    const payload = {
      name: 'Updated Test Resource',
      description: 'Updated by E2E test',
    };
    
    const response = await fetch(
      `${BASE_URL}/api/resources/${resourceId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${adminToken}`,
        },
        body: JSON.stringify(payload),
      }
    );
    
    assert(response.ok, testName, `Update failed: ${response.status}`);
    
    const result = await response.json();
    assert(result.data, testName, 'No data in response');
    assert(
      result.data.name === payload.name, 
      testName, 
      'Name not updated'
    );
    
    log(`Resource updated successfully`);
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 05 - DELETE RESOURCE
// ============================================================

async function test05_deleteResource(resourceId) {
  const testName = 'Delete Resource';
  log(`TEST 05: ${testName}`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/resources/${resourceId}`,
      {
        method: 'DELETE',
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Delete failed: ${response.status}`);
    
    log(`Resource deleted successfully`);
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║              FEATURE E2E INTEGRATION TEST                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}\n`);
  console.log('⚠️  Ensure LOCAL server is running: npm run dev\n');
  console.log('═'.repeat(60) + '\n');
  
  try {
    await test01_login();
    console.log();
    
    const resourceId = await test02_createResource();
    console.log();
    
    await test03_readResource(resourceId);
    console.log();
    
    await test04_updateResource(resourceId);
    console.log();
    
    await test05_deleteResource(resourceId);
    console.log();
    
  } catch (error) {
    console.error('\n🔴 Test suite aborted due to failure\n');
  }
  
  // ============================================================
  // FINAL REPORT
  // ============================================================
  
  console.log('═'.repeat(60));
  console.log('FINAL REPORT');
  console.log('═'.repeat(60));
  console.log(`\n✅ PASSED: ${testResults.passed.length}`);
  testResults.passed.forEach(t => console.log(`   - ${t}`));
  
  console.log(`\n❌ FAILED: ${testResults.failed.length}`);
  testResults.failed.forEach(t => console.log(`   - ${t.test}`));
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  if (testResults.failed.length > 0) {
    console.error('❌ TEST SUITE FAILED\n');
    console.error('DO NOT DEPLOY until all tests pass.\n');
    process.exit(1);
  } else {
    console.log('✅ ALL TESTS PASSED\n');
    console.log('Safe to proceed with deployment.\n');
    process.exit(0);
  }
}

main();
```

---

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up resources created during tests
- Use unique IDs or cleanup in TEST 02
- Don't rely on execution order (except authentication)

```javascript
// Good: Clean up existing data first
async function test02_validateSubtopic() {
  // Fetch existing resources
  const existing = await fetch(`${BASE_URL}/api/resources?...`);
  
  // Clean up
  if (existing.data?.length > 0) {
    for (const item of existing.data) {
      await fetch(`${BASE_URL}/api/resources/${item.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': `accessToken=${adminToken}` },
      });
    }
  }
}
```

### 2. Meaningful Assertions

```javascript
// Bad: Generic assertion
assert(response.ok, testName, 'Request failed');

// Good: Specific assertion
assert(
  response.status === 201, 
  testName, 
  `Expected 201 Created, got ${response.status}`
);

// Better: Multiple specific assertions
assert(result.data, testName, 'No data in response');
assert(result.data.id, testName, 'No ID in created resource');
assert(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.data.id),
  testName,
  `Invalid UUID format: ${result.data.id}`
);
```

### 3. Comprehensive Logging

```javascript
// Log request details
log(`Sending POST request:`, {
  url: `${BASE_URL}/api/resources`,
  payload: payload,
});

// Log response details
log(`Response received:`, {
  status: response.status,
  data: result.data,
});

// Log important state changes
log(`Resource created successfully:`, {
  id: result.data.id,
  status: result.data.status,
});
```

### 4. Error Handling

```javascript
async function testFunction() {
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      // Log detailed error information
      log(`Request failed:`, {
        status: response.status,
        statusText: response.statusText,
        error: result.error,
      });
      
      // Provide context-specific error messages
      if (response.status === 500) {
        console.error('\n🔴 HTTP 500 INTERNAL ERROR');
        console.error('Check server logs for detailed exception.');
        console.error('Likely causes:');
        console.error('- Database constraint violation');
        console.error('- Missing required field');
        console.error('- Schema mismatch\n');
      }
      
      fail(testName, `HTTP ${response.status}: ${JSON.stringify(result.error)}`);
      throw new Error(`Request failed: ${response.status}`);
    }
    
    // Continue with assertions...
    
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}
```

### 5. Test Data Management

```javascript
// Use environment variables for test data
const TEST_SUBTOPIC_ID = process.env.TEST_SUBTOPIC_ID || 
  '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

// Generate unique IDs for resources
const uniqueId = crypto.randomUUID();

// Use realistic test payloads (copy from actual data)
const JAVA_DEFINITION_PAYLOAD = {
  page: {
    type: 'definition',
    category: 'Java',
    title: 'What Is Java?',
    // ... complete realistic payload
  }
};
```

### 6. Test Sequence Design

**IMPORTANT:** Follow the **actual business lifecycle**, not blindly follow CRUD.

E2E tests must mirror real user workflows and business operations, not theoretical database operations.

#### Example: Tutorial Composer (Real Business Lifecycle)

```javascript
// 1. Authentication (prerequisite)
await test01_login();

// 2. Data validation (prerequisite)
await test02_validateSubtopic();

// 3. Create tutorial
const { tutorialId } = await test03_create();

// 4. Read (verify creation)
await test04_read(tutorialId);

// 5. Update with multiple blocks (actual workflow)
await test05_update(tutorialId);

// 6. Read (verify update persistence)
await test06_readAfterUpdate(tutorialId);

// 7. Publish (actual business operation)
await test07_publish(tutorialId);

// 8. Read (verify publish status)
await test08_readPublished(tutorialId);

// 9. Regression tests (protect against known bugs)
await test09_invalidUUIDRegression();
await test10_validUUIDRegression();

// Note: No DELETE - not part of Tutorial Composer business workflow
// Cleanup happens in test02 (prerequisite validation)
```

#### Example: Quiz Management (Different Lifecycle)

```javascript
// Different feature = different lifecycle
await test01_login();
await test02_createQuiz();
await test03_addQuestions();        // Multi-step workflow
await test04_readQuiz();
await test05_updateQuizSettings();
await test06_archiveQuiz();         // Archive, not delete
await test07_restoreQuiz();         // Restore operation
await test08_deleteQuiz();          // Final cleanup
```

#### Principle: Test What Users Actually Do

```
❌ Wrong: Force CRUD pattern on every feature
✅ Right: Test the actual business operations

Tutorial Composer:
  CREATE → READ → UPDATE → READ → PUBLISH → READ

User Management:
  CREATE → READ → UPDATE → DEACTIVATE → REACTIVATE

Quiz:
  CREATE → ADD_QUESTIONS → PUBLISH → ARCHIVE → DELETE

Payment:
  INITIATE → VERIFY → PROCESS → CONFIRM → REFUND
```

---

## Troubleshooting

### Server Not Running

**Symptom:**

```
[FAIL] Login
ECONNREFUSED 127.0.0.1:3007
```

**Solution:**

```bash
# Start the server first
npm run dev

# Wait for "Ready" message
# Then run test in separate terminal
```

### Authentication Failed

**Symptom:**

```
[FAIL] Login
Login failed: 401
```

**Solution:**

```bash
# Verify credentials in .env.local
cat .env.local | grep ADMIN

# Ensure user exists in database
psql $DATABASE_URL -c "SELECT email FROM users WHERE email='admin@example.com';"

# Reset password if needed
npm run reset-admin-password
```

### Database Connection Error

**Symptom:**

```
[FAIL] Create Resource
Database connection error
```

**Solution:**

```bash
# Check database is running
pg_isready -h localhost -p 5432

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Foreign Key Constraint Violation

**Symptom:**

```
[FAIL] Create Resource
HTTP 500: Foreign key constraint violation
```

**Solution:**

```bash
# Check server logs for specific FK
npm run dev  # View logs in this terminal

# Verify referenced record exists
psql $DATABASE_URL -c "SELECT id FROM parent_table WHERE id='referenced-id';"

# Run sync scripts if needed
node scripts/sync-data.mjs
```

### Test Passes Locally but Fails in CI

**Possible Causes:**

1. **Environment variables missing in CI**
   - Add secrets to CI platform
   - Verify `.env.local` is not in `.gitignore`

2. **Database not available in CI**
   - Add database service to CI config
   - Run migrations before tests

3. **Port conflict in CI**
   - Use dynamic port allocation
   - Check for port availability

4. **Race condition**
   - Add delays after server start
   - Implement retry logic for connection

---

## Example: Tutorial Composer E2E

### File: `scripts/test-tutorial-composer-e2e.mjs`

This is the reference implementation for Tutorial Composer E2E test.

**What it tests:**

1. ✅ **Authentication** - Admin login with session token
2. ✅ **Data Validation** - Subtopic exists in database
3. ✅ **CREATE** - Tutorial with valid UUID block
4. ✅ **READ** - Verify created tutorial
5. ✅ **UPDATE** - PATCH with 5 blocks
6. ✅ **READ** - Verify 5-block persistence
7. ✅ **PUBLISH** - Status transition to deployed
8. ✅ **READ** - Verify published tutorial
9. ✅ **Validation** - Invalid UUID rejection
10. ✅ **Regression** - Valid UUID acceptance

### Running the Test

```bash
# Terminal 1: Start SkillHubCore Admin
npm run dev

# Wait for: ✓ Ready in X.Xs
# Look for: ○ Local: http://localhost:3007

# Terminal 2: Run E2E test
node scripts/test-tutorial-composer-e2e.mjs

# Expected output:
# ✅ PASSED: 10
# ❌ FAILED: 0
# ✅ ALL TESTS PASSED
```

### Key Features

**1. Proper PATCH Update**

```javascript
// CORRECT: Use PATCH for update
const response = await fetch(
  `${BASE_URL}/api/tutorial-composer/sections/${tutorialId}`,
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
    body: JSON.stringify({
      content: tutorialDocument,
    }),
  }
);

// WRONG: Don't use POST for update (causes 409 conflict)
```

**2. Multi-Block Persistence Verification**

```javascript
// Generate 5 unique UUIDs
const blockIds = [
  crypto.randomUUID(),
  crypto.randomUUID(),
  crypto.randomUUID(),
  crypto.randomUUID(),
  crypto.randomUUID(),
];

// Update with 5 blocks
await updateTutorial(tutorialId, blockIds);

// Read back and verify all 5 blocks persisted
const tutorial = await readTutorial(tutorialId);
assert(tutorial.content.blocks.length === 5);

// Verify IDs match exactly
tutorial.content.blocks.forEach((block, index) => {
  assert(block.id === blockIds[index]);
});
```

**3. Publish Workflow**

```javascript
// Publish
await fetch(`${BASE_URL}/api/tutorial-composer/sections/${tutorialId}/publish`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `accessToken=${adminToken}`,
  },
});

// Verify status changed
assert(result.data.status === 'deployed');
assert(result.data.publishedAt !== null);

// Read published tutorial
const published = await fetch(
  `${BASE_URL}/api/tutorial-composer/sections?status=deployed&...`
);

// Verify blocks persisted through publish
assert(published.content.blocks.length === 5);
```

**4. UUID Validation Regression**

```javascript
// Test 1: Invalid UUID must be rejected
const invalidId = `block-${Date.now()}`;
const response = await createTutorial(invalidId);
assert(response.status === 400);
assert(response.error.details[0].path === 'content.blocks.0.id');
assert(response.error.details[0].message.includes('uuid'));

// Test 2: Valid UUID must be accepted
const validId = crypto.randomUUID();
const response2 = await createTutorial(validId);
assert(response2.status !== 400 || !hasUUIDError(response2));
```

---

## Summary Checklist

Before running E2E tests:

- [ ] Server is running on correct port
- [ ] Database is accessible
- [ ] `.env.local` has valid credentials
- [ ] Test data prerequisites exist (e.g., subtopic in DB)
- [ ] No conflicting processes on port

After E2E tests pass:

- [ ] Review test output for warnings
- [ ] Check server logs for unexpected errors
- [ ] Verify database state is clean
- [ ] Run `npm run type-check`
- [ ] Commit test script with descriptive message
- [ ] Document any setup requirements

---

## Additional Resources

- **Tutorial Composer E2E**: `scripts/test-tutorial-composer-e2e.mjs`
- **Environment Setup**: `.env.local.example`
- **API Documentation**: `docs/api/`
- **Database Schemas**: `packages/db-*/prisma/schema.prisma`

---

**Last Updated:** 2026-08-22  
**Maintained By:** Engineering Team  
**Questions?** Check server logs first, then ask in #engineering
