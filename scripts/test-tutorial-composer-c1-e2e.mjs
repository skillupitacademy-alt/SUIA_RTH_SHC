#!/usr/bin/env node
/**
 * Tutorial Composer C1 E2E Integration Test
 * 
 * Tests the complete C1 block lifecycle against LOCAL API:
 * - Authentication
 * - Cleanup (strict verification)
 * - Create canonical C1
 * - Read canonical C1
 * - Load → PATCH → read (no double-conversion regression)
 * - D1 + C1 + C1 document (c1-018 fixture pattern)
 * - Publish
 * - Read published
 * - Canonical storage invariants (no memoryModel)
 * - UUID regression tests
 * - Republish deployed tutorial
 * 
 * DOES NOT TEST (separate test boundary):
 * - Composer UI conversion (requires UI harness / unit test)
 * - memoryModel warning UI (requires UI test)
 * - Learner delivery rendering (requires learner app)
 * 
 * Run LOCAL server first:
 * npm run dev
 * 
 * Then:
 * node scripts/test-tutorial-composer-c1-e2e.mjs
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillhubcore.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'testing';
const TEST_SUBTOPIC_ID = process.env.TEST_SUBTOPIC_ID || '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const UUID_TEST_SUBTOPIC_ID = process.env.UUID_TEST_SUBTOPIC_ID || ''; // REQUIRED: Secondary test subtopic for UUID validation tests (MUST be different from TEST_SUBTOPIC_ID)
const BRAND_ID = 'shared';

// NOTE: UUID_TEST_SUBTOPIC_ID must reference a known-valid subtopic in your database.
// It is used exclusively for TEST 10 and TEST 11 to isolate UUID validation tests
// from the main C1-018 lifecycle.
// REQUIRED: $env:UUID_TEST_SUBTOPIC_ID="<another-valid-subtopic-uuid>"

// ============================================================
// TEST DATA - From c1-018-fixture.ts (authoritative)
// ============================================================

// Definition D1 - Python Variable
const DEFINITION_D1_PYTHON_VARIABLE = {
  "page": {
    "type": "definition",
    "category": "Python Fundamentals",
    "title": "What Is a Python Variable?",
    "intro": "A variable gives a name to a value so that a Python program can work with that value later.",
    "definition": "A Python variable is a name that refers to an object stored in memory.",
    "explanation": [
      "Python variables do not directly contain the value itself.",
      "The variable name refers to a Python object.",
      "The same object can be referenced by multiple names."
    ],
    "example": {
      "language": "python",
      "code": "name = \"Alice\""
    },
    "characteristics": [
      {
        "icon": "🏷️",
        "title": "Name",
        "description": "A variable provides a readable name for referring to an object."
      },
      {
        "icon": "🧠",
        "title": "Object Reference",
        "description": "The variable refers to an object rather than storing a primitive value directly."
      }
    ],
    "takeaway": "Think of a Python variable as a name that refers to an object."
  }
};

// Code C1 - Creating a Python Variable
const CODE_C1_CREATING_VARIABLE = {
  "page": {
    "type": "code",
    "title": "Creating a Python Variable",
    "introduction": "Python variables can be created by assigning a value to a name using the assignment operator.",
    "language": "python",
    "code": "name = \"Alice\"\nage = 25\nprint(name)\nprint(age)",
    "explanation": [
      {
        "focus": "name = \"Alice\"",
        "description": "The name variable refers to the string object \"Alice\"."
      },
      {
        "focus": "age = 25",
        "description": "The age variable refers to the integer object 25."
      },
      {
        "focus": "print(name)",
        "description": "Python retrieves the object referenced by name and prints it."
      }
    ],
    "output": {
      "value": "Alice\n25",
      "description": "The program prints both variable values"
    },
    "takeaway": "Assignment creates or updates a name-to-object reference in Python."
  }
};

// Code C1 - Changing a Python Variable
const CODE_C1_CHANGING_VARIABLE = {
  "page": {
    "type": "code",
    "title": "Changing a Python Variable",
    "introduction": "A variable can later be assigned to a different object through reassignment.",
    "language": "python",
    "code": "score = 10\nprint(score)\nscore = 20\nprint(score)",
    "explanation": [
      {
        "focus": "score = 10",
        "description": "score initially refers to the integer object 10."
      },
      {
        "focus": "score = 20",
        "description": "The name score is reassigned to the integer object 20."
      }
    ],
    "output": {
      "value": "10\n20"
    },
    "takeaway": "Variables can be reassigned to different objects during execution."
  }
};

// ============================================================
// STATE
// ============================================================

let adminToken = null;
let createdTutorialId = null;
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
    throw new Error(`Assertion failed: ${message}`);
  }
}

function validateTestConfiguration() {
  console.log('\n🔍 Validating test configuration...\n');
  
  if (!UUID_TEST_SUBTOPIC_ID) {
    console.error('❌ CONFIGURATION ERROR:\n');
    console.error('UUID_TEST_SUBTOPIC_ID is required and must reference a known-valid subtopic.\n');
    console.error('To fix, set UUID_TEST_SUBTOPIC_ID:');
    console.error('  $env:UUID_TEST_SUBTOPIC_ID="<another-valid-subtopic-uuid>"\n');
    throw new Error(
      'UUID_TEST_SUBTOPIC_ID is required and must reference a known-valid subtopic.'
    );
  }
  
  if (TEST_SUBTOPIC_ID === UUID_TEST_SUBTOPIC_ID) {
    console.error('❌ CONFIGURATION ERROR:\n');
    console.error('TEST_SUBTOPIC_ID and UUID_TEST_SUBTOPIC_ID must be different.');
    console.error('UUID regression tests must never operate on the main C1 E2E subtopic.\n');
    console.error('Current configuration:');
    console.error(`  TEST_SUBTOPIC_ID:      ${TEST_SUBTOPIC_ID}`);
    console.error(`  UUID_TEST_SUBTOPIC_ID: ${UUID_TEST_SUBTOPIC_ID}\n`);
    console.error('To fix, set a different UUID_TEST_SUBTOPIC_ID:');
    console.error('  $env:UUID_TEST_SUBTOPIC_ID="<another-valid-subtopic-uuid>"\n');
    throw new Error(
      'TEST_SUBTOPIC_ID and UUID_TEST_SUBTOPIC_ID must be different. ' +
      'UUID regression tests must never operate on the main C1 E2E subtopic.'
    );
  }
  
  console.log('✅ Configuration valid:');
  console.log(`   TEST_SUBTOPIC_ID:      ${TEST_SUBTOPIC_ID}`);
  console.log(`   UUID_TEST_SUBTOPIC_ID: ${UUID_TEST_SUBTOPIC_ID}`);
  console.log('   UUID tests are properly isolated.\n');
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
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    
    assert(response.ok, testName, `Login failed: ${response.status} ${response.statusText}`);
    
    const setCookie = response.headers.get('set-cookie');
    adminToken = setCookie?.match(/accessToken=([^;]+)/)?.[1];
    
    assert(adminToken, testName, 'No access token found in response');
    
    log(`Authenticated successfully`);
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 02 - CLEANUP EXISTING TUTORIALS (STRICT)
// ============================================================

async function test02_cleanupExisting() {
  const testName = 'Cleanup Existing Tutorials (Strict)';
  log(`TEST 02: ${testName}`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=100`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Query failed: ${response.status}`);
    
    const result = await response.json();
    
    if (result.data && result.data.length > 0) {
      log(`Found ${result.data.length} existing tutorial(s), cleaning up...`);
      
      const deletePromises = result.data.map(tutorial =>
        fetch(`${BASE_URL}/api/tutorial-composer/sections/${tutorial.id}`, {
          method: 'DELETE',
          headers: { 'Cookie': `accessToken=${adminToken}` },
        }).then(resp => ({
          id: tutorial.id,
          status: tutorial.status,
          ok: resp.ok,
        }))
      );
      
      const deleteResults = await Promise.all(deletePromises);
      
      const failedDeletes = deleteResults.filter(r => !r.ok);
      
      assert(failedDeletes.length === 0, testName, 
        `Failed to delete ${failedDeletes.length} tutorial(s): ${failedDeletes.map(r => r.id).join(', ')}`
      );
      
      log(`✅ Deleted all ${result.data.length} tutorial(s)`);
    } else {
      log(`No existing tutorials found`);
    }
    
    // Verify cleanup succeeded (strict verification)
    const verifyResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    const verifyResult = await verifyResponse.json();
    
    assert(verifyResult.data.length === 0, testName, 
      `Cleanup verification failed: ${verifyResult.data.length} tutorial(s) still exist`
    );
    
    log(`✅ Verified: zero tutorials remaining`);
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 03 - CREATE CANONICAL C1
// ============================================================

async function test03_createCanonicalC1() {
  const testName = 'Create Canonical C1';
  log(`TEST 03: ${testName}`);
  
  try {
    const blockId = randomUUID();
    log(`Generated block ID: ${blockId}`);
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: blockId,
          type: 'code',
          version: 'C1',
          content: CODE_C1_CREATING_VARIABLE,
        }
      ]
    };
    
    const payload = {
      subtopicId: TEST_SUBTOPIC_ID,
      brandId: BRAND_ID,
      content: tutorialDocument,
      orderIndex: 0,
    };
    
    log(`Sending POST request with canonical C1 content`);
    
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      log(`CREATE FAILED:`, result.error);
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result.error)}`);
    }
    
    assert(result.data, testName, 'No data in response');
    assert(result.data.id, testName, 'No tutorial ID in response');
    
    createdTutorialId = result.data.id;
    
    log(`Tutorial created successfully:`, {
      id: createdTutorialId,
      status: result.data.status,
    });
    
    pass(testName);
    return { tutorialId: createdTutorialId, blockId };
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 04 - READ CANONICAL C1
// ============================================================

async function test04_readCanonicalC1(tutorialId, expectedBlockId) {
  const testName = 'Read Canonical C1';
  log(`TEST 04: ${testName}`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Read failed: ${response.status}`);
    
    const result = await response.json();
    
    assert(result.data, testName, 'No data in response');
    assert(result.data.length > 0, testName, 'No tutorials found');
    
    const tutorial = result.data[0];
    
    assert(tutorial.id === tutorialId, testName, 'Tutorial ID mismatch');
    assert(tutorial.content, testName, 'No content in tutorial');
    assert(tutorial.content.blocks, testName, 'No blocks array');
    assert(tutorial.content.blocks.length === 1, testName, `Expected 1 block, got ${tutorial.content.blocks.length}`);
    
    const block = tutorial.content.blocks[0];
    assert(block.id === expectedBlockId, testName, 'Block ID mismatch');
    assert(block.type === 'code', testName, 'Block type mismatch');
    assert(block.version === 'C1', testName, `Block version mismatch: expected 'C1', got '${block.version}'`);
    
    // Verify canonical C1 structure
    assert(block.content.page, testName, 'Missing page in C1 content');
    assert(block.content.page.type === 'code', testName, 'page.type mismatch');
    assert(block.content.page.language, testName, 'Missing page.language');
    assert(block.content.page.code, testName, 'Missing page.code');
    assert(Array.isArray(block.content.page.explanation), testName, 'page.explanation not an array');
    assert(block.content.page.explanation.length >= 2, testName, 'page.explanation has less than 2 items');
    
    // Verify explanation structure (focus + description)
    const firstExplanation = block.content.page.explanation[0];
    assert(firstExplanation.focus, testName, 'Missing focus in explanation');
    assert(firstExplanation.description, testName, 'Missing description in explanation');
    
    // Verify NO memoryModel in canonical C1
    assert(!block.content.memoryModel, testName, 'memoryModel should NOT exist in canonical C1');
    
    log(`Canonical C1 verified:`, {
      id: tutorial.id,
      blockId: block.id,
      version: block.version,
      language: block.content.page.language,
      explanationCount: block.content.page.explanation.length,
      hasMemoryModel: !!block.content.memoryModel,
    });
    
    pass(testName);
    return { tutorial, block };
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 05 - LOAD CANONICAL C1 AGAIN (NO DOUBLE-CONVERSION)
// ============================================================

async function test05_loadCanonicalC1NoDoubleConversion(tutorialId, originalTutorial) {
  const testName = 'Load Canonical C1 - No Double-Conversion';
  log(`TEST 05: ${testName} (CRITICAL REGRESSION TEST)`);
  
  try {
    // Snapshot original complete TutorialDocument (authoritative)
    const originalDocumentSnapshot = JSON.stringify(originalTutorial.content);
    
    // Read the canonical C1 again
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Read failed: ${response.status}`);
    
    const result = await response.json();
    const tutorial = result.data[0];
    
    // Now PATCH without editing (simulating load → save cycle)
    log(`Performing PATCH with unmodified content`);
    const patchResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${tutorialId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${adminToken}`,
        },
        body: JSON.stringify({
          content: tutorial.content, // Send back exactly what we received
        }),
      }
    );
    
    assert(patchResponse.ok, testName, `PATCH failed: ${patchResponse.status}`);
    
    // Read back again
    const verifyResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    const verifyResult = await verifyResponse.json();
    const verifyTutorial = verifyResult.data[0];
    
    // Snapshot final complete TutorialDocument (authoritative)
    const finalDocumentSnapshot = JSON.stringify(verifyTutorial.content);
    
    // CRITICAL: Complete TutorialDocument must be byte-for-byte identical
    assert(
      finalDocumentSnapshot === originalDocumentSnapshot,
      testName,
      'TutorialDocument mutated during load → save cycle (complete document comparison)'
    );
    
    log(`✅ TutorialDocument survived load → save cycle without mutation`);
    log(`✅ Complete document structure preserved (JSON snapshot match)`);
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 06 - MIXED D1 + C1 + C1 DOCUMENT (c1-018 fixture pattern)
// ============================================================

async function test06_mixedD1C1C1Document() {
  const testName = 'Mixed D1 + C1 + C1 Document';
  log(`TEST 06: ${testName} (c1-018 fixture pattern)`);
  
  try {
    const d1BlockId = randomUUID();
    const c1Block1Id = randomUUID();
    const c1Block2Id = randomUUID();
    
    log(`Generated block IDs:`, {
      D1: d1BlockId,
      C1_1: c1Block1Id,
      C1_2: c1Block2Id,
    });
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: d1BlockId,
          type: 'definition',
          version: 'D1',
          content: DEFINITION_D1_PYTHON_VARIABLE,
        },
        {
          id: c1Block1Id,
          type: 'code',
          version: 'C1',
          content: CODE_C1_CREATING_VARIABLE,
        },
        {
          id: c1Block2Id,
          type: 'code',
          version: 'C1',
          content: CODE_C1_CHANGING_VARIABLE,
        }
      ]
    };
    
    // Update existing tutorial
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections/${createdTutorialId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify({
        content: tutorialDocument,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(result.error)}`);
    }
    
    // Verify mixed document
    assert(result.data.content.blocks.length === 3, testName, `Expected 3 blocks, got ${result.data.content.blocks.length}`);
    
    const d1Block = result.data.content.blocks[0];
    const c1Block1 = result.data.content.blocks[1];
    const c1Block2 = result.data.content.blocks[2];
    
    assert(d1Block.type === 'definition', testName, 'First block type mismatch');
    assert(d1Block.version === 'D1', testName, 'First block version mismatch');
    
    assert(c1Block1.type === 'code', testName, 'Second block type mismatch');
    assert(c1Block1.version === 'C1', testName, 'Second block version mismatch');
    
    assert(c1Block2.type === 'code', testName, 'Third block type mismatch');
    assert(c1Block2.version === 'C1', testName, 'Third block version mismatch');
    
    // Verify C1 blocks have distinct IDs
    assert(c1Block1.id !== c1Block2.id, testName, 'C1 block IDs should be distinct');
    
    // Verify C1 blocks have distinct content
    assert(c1Block1.content.page.title !== c1Block2.content.page.title, testName, 'C1 blocks should have different titles');
    assert(c1Block1.content.page.code !== c1Block2.content.page.code, testName, 'C1 blocks should have different code');
    
    log(`Mixed D1+C1+C1 document created:`, {
      id: result.data.id,
      blocksCount: result.data.content.blocks.length,
      block1: `${d1Block.type}:${d1Block.version}`,
      block2: `${c1Block1.type}:${c1Block1.version} (${c1Block1.content.page.title})`,
      block3: `${c1Block2.type}:${c1Block2.version} (${c1Block2.content.page.title})`,
    });
    
    pass(testName);
    return { d1BlockId, c1Block1Id, c1Block2Id };
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 07 - PUBLISH MIXED DOCUMENT
// ============================================================

async function test07_publishMixedDocument(tutorialId) {
  const testName = 'Publish Mixed Document';
  log(`TEST 07: ${testName}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections/${tutorialId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Publish failed: HTTP ${response.status}: ${JSON.stringify(result.error)}`);
    }
    
    assert(result.data, testName, 'No data in response');
    assert(result.data.status === 'deployed', testName, `Expected status 'deployed', got '${result.data.status}'`);
    assert(result.data.publishedAt, testName, 'publishedAt is null');
    
    log(`Mixed document published successfully:`, {
      id: result.data.id,
      status: result.data.status,
      publishedAt: result.data.publishedAt,
    });
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 08 - READ PUBLISHED MIXED DOCUMENT
// ============================================================

async function test08_readPublishedMixedDocument(tutorialId, expectedD1Id, expectedC1Id1, expectedC1Id2) {
  const testName = 'Read Published Mixed Document';
  log(`TEST 08: ${testName}`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&status=deployed&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Read failed: ${response.status}`);
    
    const result = await response.json();
    
    assert(result.data, testName, 'No data in response');
    assert(result.data.length > 0, testName, 'No published tutorials found');
    
    const tutorial = result.data[0];
    
    assert(tutorial.id === tutorialId, testName, 'Tutorial ID mismatch');
    assert(tutorial.status === 'deployed', testName, `Expected status 'deployed', got '${tutorial.status}'`);
    assert(tutorial.content.blocks.length === 3, testName, `Expected 3 blocks, got ${tutorial.content.blocks.length}`);
    
    // Verify blocks persisted through publish
    const d1Block = tutorial.content.blocks[0];
    const c1Block1 = tutorial.content.blocks[1];
    const c1Block2 = tutorial.content.blocks[2];
    
    assert(d1Block.id === expectedD1Id, testName, 'D1 block ID changed after publish');
    assert(c1Block1.id === expectedC1Id1, testName, 'C1 block 1 ID changed after publish');
    assert(c1Block2.id === expectedC1Id2, testName, 'C1 block 2 ID changed after publish');
    
    assert(d1Block.version === 'D1', testName, 'D1 version changed after publish');
    assert(c1Block1.version === 'C1', testName, 'C1 block 1 version changed after publish');
    assert(c1Block2.version === 'C1', testName, 'C1 block 2 version changed after publish');
    
    log(`Published mixed document verified:`, {
      id: tutorial.id,
      status: tutorial.status,
      blocksCount: tutorial.content.blocks.length,
      publishedAt: tutorial.publishedAt,
    });
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 09 - CANONICAL STORAGE INVARIANT (NO MEMORYMODEL)
// ============================================================

async function test09_canonicalStorageInvariant(tutorialId) {
  const testName = 'Canonical Storage Invariant - No memoryModel';
  log(`TEST 09: ${testName}`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Read failed: ${response.status}`);
    
    const result = await response.json();
    const tutorial = result.data[0];
    
    // Verify NO memoryModel in any C1 block
    const c1Blocks = tutorial.content.blocks.filter(b => b.type === 'code' && b.version === 'C1');
    
    assert(c1Blocks.length > 0, testName, 'No C1 blocks found');
    
    c1Blocks.forEach((block, index) => {
      assert(!block.content.memoryModel, testName, 
        `C1 block ${index} contains memoryModel (should NOT exist in canonical C1)`
      );
      
      // Also verify no legacy structure remnants
      assert(!block.content.code, testName, `C1 block ${index} contains legacy 'code' object`);
      assert(!block.content.explanation?.steps, testName, `C1 block ${index} contains legacy 'explanation.steps'`);
      assert(!block.content.takeaway?.items, testName, `C1 block ${index} contains legacy 'takeaway.items' array`);
    });
    
    log(`✅ Verified: ${c1Blocks.length} C1 block(s) have NO memoryModel or legacy structure`);
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 10 - INVALID UUID REGRESSION
// ============================================================

async function test10_invalidUUIDRegression() {
  const testName = 'Invalid UUID Rejection';
  log(`TEST 10: ${testName}`);
  
  try {
    const invalidBlockId = `block-code-c1-${Date.now().toString(36)}`;
    log(`Generated INVALID block ID: ${invalidBlockId}`);
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: invalidBlockId, // ❌ NOT a valid UUID
          type: 'code',
          version: 'C1',
          content: CODE_C1_CREATING_VARIABLE,
        }
      ]
    };
    
    // Use the UUID test subtopic (known valid, should not have a tutorial currently)
    const payload = {
      subtopicId: UUID_TEST_SUBTOPIC_ID,
      brandId: BRAND_ID,
      content: tutorialDocument,
      orderIndex: 999, // High order to avoid conflicts
    };
    
    log(`Testing invalid UUID with known-valid subtopic: ${UUID_TEST_SUBTOPIC_ID}`);
    
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    // MUST be rejected with 400
    assert(response.status === 400, testName, `Expected 400, got ${response.status}`);
    assert(result.error, testName, 'No error in response');
    
    const uuidError = result.error.details?.find(d => 
      d.path === 'content.blocks.0.id' && d.message.toLowerCase().includes('uuid')
    );
    
    assert(uuidError, testName, 'Did not find UUID validation error in expected path');
    
    log(`Invalid UUID correctly rejected:`, {
      status: response.status,
      errorPath: uuidError.path,
      errorMessage: uuidError.message,
    });
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 11 - VALID UUID REGRESSION
// ============================================================

async function test11_validUUIDRegression() {
  const testName = 'Valid UUID Acceptance';
  log(`TEST 11: ${testName}`);
  
  let createdTutorialIdForCleanup = null;
  
  try {
    const validBlockId = randomUUID();
    log(`Generated VALID block ID: ${validBlockId}`);
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: validBlockId, // ✅ Valid UUID
          type: 'code',
          version: 'C1',
          content: CODE_C1_CREATING_VARIABLE,
        }
      ]
    };
    
    // Use the UUID test subtopic (known valid)
    const payload = {
      subtopicId: UUID_TEST_SUBTOPIC_ID,
      brandId: BRAND_ID,
      content: tutorialDocument,
      orderIndex: 999, // High order to avoid conflicts
    };
    
    log(`Testing valid UUID with known-valid subtopic: ${UUID_TEST_SUBTOPIC_ID}`);
    
    // First, clean up any existing tutorial for this subtopic to avoid 409 (STRICT CLEANUP)
    const cleanupResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${UUID_TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=100`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(
      cleanupResponse.ok,
      testName,
      `UUID test subtopic cleanup query failed: ${cleanupResponse.status}`
    );
    
    const cleanupResult = await cleanupResponse.json();
    
    if (cleanupResult.data && cleanupResult.data.length > 0) {
      log(`Cleaning up ${cleanupResult.data.length} existing tutorial(s) for UUID test subtopic`);
      
      for (const tutorial of cleanupResult.data) {
        const deleteResponse = await fetch(
          `${BASE_URL}/api/tutorial-composer/sections/${tutorial.id}`,
          {
            method: 'DELETE',
            headers: { 'Cookie': `accessToken=${adminToken}` },
          }
        );
        
        assert(
          deleteResponse.ok,
          testName,
          `Failed to delete UUID test tutorial ${tutorial.id}: ${deleteResponse.status}`
        );
      }
      
      log(`✅ Deleted all ${cleanupResult.data.length} tutorial(s) from UUID test subtopic`);
    }
    
    // Verify cleanup succeeded (strict verification)
    const verifyCleanupResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${UUID_TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(verifyCleanupResponse.ok, testName, 'UUID test cleanup verification failed');
    
    const verifyCleanupResult = await verifyCleanupResponse.json();
    
    assert(
      verifyCleanupResult.data.length === 0,
      testName,
      `UUID test subtopic cleanup failed: ${verifyCleanupResult.data.length} tutorial(s) remain`
    );
    
    log(`✅ Verified: zero tutorials remaining in UUID test subtopic`);
    
    // Now create with valid UUID
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    // Must be accepted with 201
    if (!response.ok) {
      throw new Error(`Expected 201, got ${response.status}: ${JSON.stringify(result.error)}`);
    }
    
    assert(response.status === 201, testName, `Expected 201, got ${response.status}`);
    assert(result.data, testName, 'No data in response');
    assert(result.data.content.blocks.length === 1, testName, 'Expected 1 block');
    assert(result.data.content.blocks[0].id === validBlockId, testName, 
      `Block ID mismatch: expected ${validBlockId}, got ${result.data.content.blocks[0].id}`);
    
    createdTutorialIdForCleanup = result.data.id;
    
    log(`Valid UUID accepted and persisted:`, {
      status: response.status,
      tutorialId: result.data.id,
      blockId: result.data.content.blocks[0].id,
    });
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  } finally {
    // Clean up the created tutorial (STRICT)
    if (createdTutorialIdForCleanup) {
      log(`Cleaning up test tutorial: ${createdTutorialIdForCleanup}`);
      
      const deleteResponse = await fetch(
        `${BASE_URL}/api/tutorial-composer/sections/${createdTutorialIdForCleanup}`,
        {
          method: 'DELETE',
          headers: {
            'Cookie': `accessToken=${adminToken}`,
          },
        }
      );
      
      if (!deleteResponse.ok) {
        fail(
          testName,
          `Failed to cleanup UUID test tutorial ${createdTutorialIdForCleanup}: ${deleteResponse.status}`
        );
      } else {
        log(`✅ Cleaned up UUID test tutorial ${createdTutorialIdForCleanup}`);
      }
      
      // Verify cleanup succeeded
      const verifyFinalCleanup = await fetch(
        `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${UUID_TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
        {
          headers: { 'Cookie': `accessToken=${adminToken}` },
        }
      );
      
      if (!verifyFinalCleanup.ok) {
        fail(
          testName,
          `UUID test subtopic cleanup verification request failed: ${verifyFinalCleanup.status}`
        );
      } else {
        const verifyResult = await verifyFinalCleanup.json();
        
        if (verifyResult.data.length > 0) {
          fail(
            testName,
            `UUID test subtopic final cleanup failed: ${verifyResult.data.length} tutorial(s) remain`
          );
        } else {
          log(`✅ Verified: UUID test subtopic is clean (zero tutorials)`);
        }
      }
    }
  }
}

// ============================================================
// TEST 12 - UPDATE AND REPUBLISH DEPLOYED D1+C1+C1 DOCUMENT
// ============================================================

async function test12_updateAndRepublishDeployedDocument(tutorialId, expectedD1Id, expectedC1Id1, expectedC1Id2) {
  const testName = 'Update and Republish Deployed D1+C1+C1 Document';
  log(`TEST 12: ${testName}`);
  
  try {
    // Update one C1 block while preserving the D1+C1+C1 structure
    const updatedTutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: expectedD1Id,
          type: 'definition',
          version: 'D1',
          content: DEFINITION_D1_PYTHON_VARIABLE, // Unchanged
        },
        {
          id: expectedC1Id1,
          type: 'code',
          version: 'C1',
          content: {
            ...CODE_C1_CREATING_VARIABLE,
            page: {
              ...CODE_C1_CREATING_VARIABLE.page,
              title: 'Creating a Python Variable — Updated',
            }
          }
        },
        {
          id: expectedC1Id2,
          type: 'code',
          version: 'C1',
          content: CODE_C1_CHANGING_VARIABLE, // Unchanged
        }
      ]
    };
    
    log(`Updating deployed tutorial while preserving D1+C1+C1 structure`);
    
    const updateResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${tutorialId}`,
      {
        method: 'PATCH',
        headers: {
          'Cookie': `accessToken=${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: updatedTutorialDocument,
        }),
      }
    );
    
    const updateResult = await updateResponse.json();
    
    assert(updateResponse.ok, testName, `Update failed: ${updateResponse.status}`);
    log(`Tutorial updated after deployment`);
    
    // Verify structure preserved
    assert(updateResult.data.content.blocks.length === 3, testName, 
      `Expected 3 blocks after update, got ${updateResult.data.content.blocks.length}`);
    
    // Now republish the already-deployed tutorial
    log(`Republishing updated D1+C1+C1 document`);
    
    const publishResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${tutorialId}/publish`,
      {
        method: 'POST',
        headers: {
          'Cookie': `accessToken=${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const publishResult = await publishResponse.json();
    
    if (!publishResponse.ok) {
      throw new Error(`Republish failed: HTTP ${publishResponse.status} - ${JSON.stringify(publishResult.error)}`);
    }
    
    assert(publishResult.data.status === 'deployed', testName, 
      `Expected status 'deployed', got '${publishResult.data.status}'`);
    
    // Verify the D1+C1+C1 structure persisted through republish
    const verifyResponse = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&status=deployed&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    const verifyResult = await verifyResponse.json();
    const verifiedTutorial = verifyResult.data[0];
    
    // Verify structure
    assert(verifiedTutorial.content.blocks.length === 3, testName, 
      `Expected 3 blocks after republish, got ${verifiedTutorial.content.blocks.length}`);
    
    // Verify IDs preserved
    const d1Block = verifiedTutorial.content.blocks[0];
    const c1Block1 = verifiedTutorial.content.blocks[1];
    const c1Block2 = verifiedTutorial.content.blocks[2];
    
    assert(d1Block.id === expectedD1Id, testName, 'D1 block ID changed after republish');
    assert(c1Block1.id === expectedC1Id1, testName, 'C1 block 1 ID changed after republish');
    assert(c1Block2.id === expectedC1Id2, testName, 'C1 block 2 ID changed after republish');
    
    // Verify versions preserved
    assert(d1Block.version === 'D1', testName, 'D1 version changed after republish');
    assert(c1Block1.version === 'C1', testName, 'C1 block 1 version changed after republish');
    assert(c1Block2.version === 'C1', testName, 'C1 block 2 version changed after republish');
    
    // Verify update persisted
    assert(c1Block1.content.page.title === 'Creating a Python Variable — Updated', testName, 
      'C1 block update did not persist through republish');
    
    log(`D1+C1+C1 document updated and republished successfully:`, {
      id: publishResult.data.id,
      status: publishResult.data.status,
      publishedAt: publishResult.data.publishedAt,
      blocksCount: verifiedTutorial.content.blocks.length,
      updatedTitle: c1Block1.content.page.title,
    });
    
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
  console.log('║     TUTORIAL COMPOSER C1 E2E INTEGRATION TEST             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);
  console.log(`Test Subtopic: ${TEST_SUBTOPIC_ID}`);
  console.log(`UUID Test Subtopic: ${UUID_TEST_SUBTOPIC_ID}`);
  console.log(`Brand: ${BRAND_ID}\n`);
  
  console.log('⚠️  Ensure LOCAL server is running: npm run dev\n');
  console.log('Test Boundary: Composer API → Storage (Admin Endpoints)');
  console.log('Separate Tests Required:');
  console.log('  - Converter: legacyCodePayloadToC1Content() unit test');
  console.log('  - UI Warning: Composer memoryModel UI test');
  console.log('  - Learner Rendering: Delivery app integration test\n');
  console.log('═'.repeat(60) + '\n');
  
  // Validate configuration BEFORE test execution (fail-fast)
  try {
    validateTestConfiguration();
  } catch (error) {
    console.error('\n🔴 Invalid test configuration - cannot proceed\n');
    console.error(error.message);
    console.error('\n');
    process.exit(1);
  }
  
  try {
    await test01_login();
    console.log();
    
    await test02_cleanupExisting();
    console.log();
    
    const { tutorialId, blockId } = await test03_createCanonicalC1();
    console.log();
    
    const { tutorial, block } = await test04_readCanonicalC1(tutorialId, blockId);
    console.log();
    
    await test05_loadCanonicalC1NoDoubleConversion(tutorialId, tutorial);
    console.log();
    
    const { d1BlockId, c1Block1Id, c1Block2Id } = await test06_mixedD1C1C1Document();
    console.log();
    
    await test07_publishMixedDocument(tutorialId);
    console.log();
    
    await test08_readPublishedMixedDocument(tutorialId, d1BlockId, c1Block1Id, c1Block2Id);
    console.log();
    
    await test09_canonicalStorageInvariant(tutorialId);
    console.log();
    
    await test10_invalidUUIDRegression();
    console.log();
    
    await test11_validUUIDRegression();
    console.log();
    
    await test12_updateAndRepublishDeployedDocument(tutorialId, d1BlockId, c1Block1Id, c1Block2Id);
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
    console.error('❌ C1 E2E TEST SUITE FAILED\n');
    console.error('DO NOT proceed with modular refactor until baseline passes.\n');
    console.error('Fix implementation and re-run E2E.\n');
    process.exit(1);
  } else {
    console.log('✅ ALL C1 E2E TESTS PASSED\n');
    console.log('═'.repeat(60));
    console.log('C1 BASELINE ESTABLISHED ✓');
    console.log('═'.repeat(60));
    console.log('\nSafe to proceed with:');
    console.log('  1. git add (implementation + E2E test)');
    console.log('  2. git commit (C1 baseline)');
    console.log('  3. Incremental modular refactor');
    console.log('  4. E2E regression testing');
    console.log('  5. 600-line governance ADR');
    console.log('  6. C2/D2/S2 development\n');
    process.exit(0);
  }
}

main();
