#!/usr/bin/env node
/**
 * Tutorial Composer E2E Integration Test
 * 
 * Tests the complete lifecycle against LOCAL API:
 * - Login
 * - Create tutorial with valid UUID
 * - Read/verify
 * - Update with 5 blocks
 * - Publish
 * - UUID validation regression
 * 
 * Run LOCAL server first:
 * npm run dev
 * 
 * Then:
 * node scripts/test-tutorial-composer-e2e.mjs
 */

import 'dotenv/config';

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillhubcore.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'testing';
const TEST_SUBTOPIC_ID = process.env.TEST_SUBTOPIC_ID || '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const BRAND_ID = 'shared';

// ============================================================
// TEST DATA - Java Definition
// ============================================================

const JAVA_DEFINITION_PAYLOAD = {
  "page": {
    "type": "definition",
    "category": "Java",
    "title": "What Is Java?",
    "intro": "Java is a high-level, object-oriented programming language designed for cross-platform compatibility and enterprise-scale applications.",
    "definition": "Java is a statically typed, compiled-and-interpreted language that runs on the Java Virtual Machine (JVM), enabling bytecode to execute uniformly across any system with a JVM implementation, regardless of underlying hardware or operating system.",
    "explanation": [
      "At its core, Java simplifies complex system development by abstracting memory management through automatic garbage collection and providing a clear, class-based object model. Its syntax derives from C and C++, but removes low-level constructs like explicit pointers, making it more accessible for building reliable, maintainable software.",
      "Practically, Java powers everything from Android mobile apps to massive backend systems in finance, e-commerce, and cloud platforms. Its \"write once, run anywhere\" (WORA) capability, robust standard library (Java SE), and vast ecosystem of frameworks (e.g., Spring, Hibernate) make it a staple in enterprise environments. The JVM also enables performance optimizations like Just-In-Time (JIT) compilation, blending portability with near-native execution speed."
    ],
    "example": {
      "language": "java",
      "code": "public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Java!\");\n    }\n}"
    },
    "characteristics": [
      {
        "icon": "☕",
        "title": "Platform Independence",
        "description": "Java compiles to bytecode that runs on any JVM, making applications portable across Windows, macOS, Linux, and more without recompilation."
      },
      {
        "icon": "🛡️",
        "title": "Strong Memory Safety",
        "description": "Automatic garbage collection and lack of manual pointer arithmetic eliminate common memory leaks and segmentation faults, enhancing stability and security."
      },
      {
        "icon": "🧩",
        "title": "Object-Oriented by Design",
        "description": "Everything (except primitives) is an object, enforcing encapsulation, inheritance, and polymorphism to encourage modular, reusable code."
      },
      {
        "icon": "⚡",
        "title": "Robust Concurrency Support",
        "description": "Built-in threading and synchronization primitives, along with the `java.util.concurrent` package, enable efficient multi-threaded execution for high-performance applications."
      }
    ],
    "takeaway": "Java's blend of portability, performance, and productivity makes it an enduring cornerstone of modern backend development and large-scale systems."
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
// TEST 02 - VALIDATE TEST SUBTOPIC
// ============================================================

async function test02_validateSubtopic() {
  const testName = 'Validate Test Subtopic';
  log(`TEST 02: ${testName}`);
  log(`Subtopic ID: ${TEST_SUBTOPIC_ID}`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
      {
        headers: { 'Cookie': `accessToken=${adminToken}` },
      }
    );
    
    assert(response.ok, testName, `Subtopic validation failed: ${response.status}`);
    
    const result = await response.json();
    
    log(`Subtopic exists and is accessible`);
    log(`Existing tutorials: ${result.data?.length || 0}`);
    
    // Clean up existing tutorials for this test
    if (result.data && result.data.length > 0) {
      log(`\nCleaning up ${result.data.length} existing tutorial(s)...`);
      for (const tutorial of result.data) {
        const deleteResponse = await fetch(
          `${BASE_URL}/api/tutorial-composer/sections/${tutorial.id}`,
          {
            method: 'DELETE',
            headers: { 'Cookie': `accessToken=${adminToken}` },
          }
        );
        if (deleteResponse.ok) {
          log(`✅ Deleted tutorial: ${tutorial.id}`);
        }
      }
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 03 - CREATE D1 WITH VALID UUID
// ============================================================

async function test03_createD1WithValidUUID() {
  const testName = 'Create D1 with Valid UUID';
  log(`TEST 03: ${testName}`);
  
  try {
    const blockId = crypto.randomUUID();
    log(`Generated block ID: ${blockId}`);
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: blockId,
          type: 'definition',
          version: 'D1',
          content: JAVA_DEFINITION_PAYLOAD,
        }
      ]
    };
    
    const payload = {
      subtopicId: TEST_SUBTOPIC_ID,
      brandId: BRAND_ID,
      content: tutorialDocument,
      orderIndex: 0,
    };
    
    log(`Sending POST request:`, {
      subtopicId: payload.subtopicId,
      brandId: payload.brandId,
      orderIndex: payload.orderIndex,
      blocksCount: payload.content.blocks.length,
      blockId,
    });
    
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
      log(`CREATE FAILED:`, {
        status: response.status,
        statusText: response.statusText,
        error: result.error,
      });
      
      fail(testName, `HTTP ${response.status}: ${JSON.stringify(result.error)}`);
      throw new Error(`Create failed: ${response.status}`);
    }
    
    assert(result.data, testName, 'No data in response');
    assert(result.data.id, testName, 'No tutorial ID in response');
    
    createdTutorialId = result.data.id;
    
    log(`Tutorial created successfully:`, {
      id: createdTutorialId,
      status: result.data.status,
      subtopicId: result.data.subtopicId,
    });
    
    pass(testName);
    return { tutorialId: createdTutorialId, blockId };
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 04 - READ AFTER CREATE
// ============================================================

async function test04_readAfterCreate(tutorialId, expectedBlockId) {
  const testName = 'Read After Create';
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
    assert(tutorial.content.schemaVersion === 1, testName, 'Schema version mismatch');
    assert(tutorial.content.blocks, testName, 'No blocks array');
    assert(tutorial.content.blocks.length === 1, testName, `Expected 1 block, got ${tutorial.content.blocks.length}`);
    
    const block = tutorial.content.blocks[0];
    assert(block.id === expectedBlockId, testName, 'Block ID mismatch');
    assert(block.type === 'definition', testName, 'Block type mismatch');
    assert(block.version === 'D1', testName, 'Block version mismatch');
    
    log(`Tutorial read successfully:`, {
      id: tutorial.id,
      blocksCount: tutorial.content.blocks.length,
      blockId: block.id,
    });
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 05 - UPDATE WITH MULTIPLE BLOCKS
// ============================================================

async function test05_updateWithMultipleBlocks(tutorialId) {
  const testName = 'Update with Multiple Blocks';
  log(`TEST 05: ${testName}`);
  
  try {
    const blockIds = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ];
    
    log(`Generated 5 block IDs:`, blockIds);
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: blockIds[0],
          type: 'definition',
          version: 'D1',
          content: JAVA_DEFINITION_PAYLOAD,
        },
        {
          id: blockIds[1],
          type: 'definition',
          version: 'D1',
          content: { ...JAVA_DEFINITION_PAYLOAD, page: { ...JAVA_DEFINITION_PAYLOAD.page, title: 'What Is Java? (Block 2)' } },
        },
        {
          id: blockIds[2],
          type: 'definition',
          version: 'D1',
          content: { ...JAVA_DEFINITION_PAYLOAD, page: { ...JAVA_DEFINITION_PAYLOAD.page, title: 'What Is Java? (Block 3)' } },
        },
        {
          id: blockIds[3],
          type: 'definition',
          version: 'D1',
          content: { ...JAVA_DEFINITION_PAYLOAD, page: { ...JAVA_DEFINITION_PAYLOAD.page, title: 'What Is Java? (Block 4)' } },
        },
        {
          id: blockIds[4],
          type: 'definition',
          version: 'D1',
          content: { ...JAVA_DEFINITION_PAYLOAD, page: { ...JAVA_DEFINITION_PAYLOAD.page, title: 'What Is Java? (Block 5)' } },
        },
      ]
    };
    
    log(`Sending PATCH request to update tutorial ${tutorialId}:`, {
      blocksCount: tutorialDocument.blocks.length,
    });
    
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections/${tutorialId}`, {
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
      fail(testName, `HTTP ${response.status}: ${JSON.stringify(result.error)}`);
      throw new Error(`Update failed: ${response.status}`);
    }
    
    assert(result.data, testName, 'No data in response');
    assert(result.data.content.blocks.length === 5, testName, `Expected 5 blocks, got ${result.data.content.blocks.length}`);
    
    log(`Tutorial updated successfully:`, {
      id: result.data.id,
      blocksCount: result.data.content?.blocks?.length,
      version: result.data.version,
    });
    
    pass(testName);
    return { blockIds };
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 06 - READ 5-BLOCK DOCUMENT
// ============================================================

async function test06_read5BlockDocument(tutorialId, expectedBlockIds) {
  const testName = 'Read 5-Block Document';
  log(`TEST 06: ${testName}`);
  
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
    assert(tutorial.content.blocks.length === 5, testName, `Expected 5 blocks, got ${tutorial.content.blocks.length}`);
    
    // Verify block IDs match
    const actualBlockIds = tutorial.content.blocks.map(b => b.id);
    expectedBlockIds.forEach((expectedId, index) => {
      assert(actualBlockIds[index] === expectedId, testName, `Block ${index} ID mismatch`);
    });
    
    // Verify all are valid UUIDs
    actualBlockIds.forEach((id, index) => {
      assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id), testName, `Block ${index} has invalid UUID: ${id}`);
    });
    
    log(`5-block document read successfully:`, {
      id: tutorial.id,
      blocksCount: tutorial.content.blocks.length,
      blockIds: actualBlockIds,
    });
    
    pass(testName);
  } catch (error) {
    fail(testName, error.message);
    throw error;
  }
}

// ============================================================
// TEST 07 - PUBLISH TUTORIAL
// ============================================================

async function test07_publishTutorial(tutorialId) {
  const testName = 'Publish Tutorial';
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
      fail(testName, `HTTP ${response.status}: ${JSON.stringify(result.error)}`);
      throw new Error(`Publish failed: ${response.status}`);
    }
    
    assert(result.data, testName, 'No data in response');
    assert(result.data.status === 'deployed', testName, `Expected status 'deployed', got '${result.data.status}'`);
    assert(result.data.publishedAt, testName, 'publishedAt is null');
    
    log(`Tutorial published successfully:`, {
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
// TEST 08 - READ PUBLISHED TUTORIAL
// ============================================================

async function test08_readPublishedTutorial(tutorialId, expectedBlockIds) {
  const testName = 'Read Published Tutorial';
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
    assert(tutorial.content.blocks.length === 5, testName, `Expected 5 blocks, got ${tutorial.content.blocks.length}`);
    
    // Verify blocks persisted through publish
    const actualBlockIds = tutorial.content.blocks.map(b => b.id);
    expectedBlockIds.forEach((expectedId, index) => {
      assert(actualBlockIds[index] === expectedId, testName, `Block ${index} ID changed after publish`);
    });
    
    log(`Published tutorial verified:`, {
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
// TEST 09 - INVALID UUID REGRESSION
// ============================================================

async function test09_invalidUUIDRegression() {
  const testName = 'Invalid UUID Rejection';
  log(`TEST 09: ${testName}`);
  
  try {
    const invalidBlockId = `block-definition-d1-${Date.now().toString(36)}`;
    log(`Generated INVALID block ID: ${invalidBlockId}`);
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: invalidBlockId, // ❌ NOT a valid UUID
          type: 'definition',
          version: 'D1',
          content: JAVA_DEFINITION_PAYLOAD,
        }
      ]
    };
    
    // Use a different subtopic to avoid conflict
    const testSubtopicId = '00000000-0000-0000-0000-000000000099';
    
    const payload = {
      subtopicId: testSubtopicId,
      brandId: BRAND_ID,
      content: tutorialDocument,
      orderIndex: 0,
    };
    
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
// TEST 10 - VALID UUID REGRESSION
// ============================================================

async function test10_validUUIDRegression() {
  const testName = 'Valid UUID Acceptance';
  log(`TEST 10: ${testName}`);
  
  try {
    const validBlockId = crypto.randomUUID();
    log(`Generated VALID block ID: ${validBlockId}`);
    
    const tutorialDocument = {
      schemaVersion: 1,
      blocks: [
        {
          id: validBlockId, // ✅ Valid UUID
          type: 'definition',
          version: 'D1',
          content: JAVA_DEFINITION_PAYLOAD,
        }
      ]
    };
    
    // Use a different subtopic to avoid conflict
    const testSubtopicId = '00000000-0000-0000-0000-000000000098';
    
    const payload = {
      subtopicId: testSubtopicId,
      brandId: BRAND_ID,
      content: tutorialDocument,
      orderIndex: 0,
    };
    
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    // MUST NOT be rejected with UUID error
    if (response.status === 400 && result.error?.details) {
      const uuidError = result.error.details.find(d => 
        d.path === 'content.blocks.0.id' && d.message.toLowerCase().includes('uuid')
      );
      
      assert(!uuidError, testName, 'Valid UUID was incorrectly rejected');
    }
    
    // May fail with other errors (subtopic doesn't exist, etc.) but NOT UUID error
    if (!response.ok && response.status !== 404) {
      log(`Got non-2xx response, but not a UUID error:`, {
        status: response.status,
        error: result.error,
      });
    }
    
    log(`Valid UUID passed validation (got ${response.status})`);
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
  console.log('║         TUTORIAL COMPOSER E2E INTEGRATION TEST            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);
  console.log(`Test Subtopic: ${TEST_SUBTOPIC_ID}`);
  console.log(`Brand: ${BRAND_ID}\n`);
  
  console.log('⚠️  Ensure LOCAL server is running: npm run dev\n');
  console.log('═'.repeat(60) + '\n');
  
  try {
    await test01_login();
    console.log();
    
    await test02_validateSubtopic();
    console.log();
    
    const { tutorialId, blockId } = await test03_createD1WithValidUUID();
    console.log();
    
    await test04_readAfterCreate(tutorialId, blockId);
    console.log();
    
    const { blockIds } = await test05_updateWithMultipleBlocks(tutorialId);
    console.log();
    
    await test06_read5BlockDocument(tutorialId, blockIds);
    console.log();
    
    await test07_publishTutorial(tutorialId);
    console.log();
    
    await test08_readPublishedTutorial(tutorialId, blockIds);
    console.log();
    
    await test09_invalidUUIDRegression();
    console.log();
    
    await test10_validUUIDRegression();
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
    console.log('Safe to proceed with:');
    console.log('  1. npm run type-check');
    console.log('  2. npm run build');
    console.log('  3. git commit');
    console.log('  4. deploy\n');
    process.exit(0);
  }
}

main();
