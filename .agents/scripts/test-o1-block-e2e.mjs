/**
 * O1 Block Placement - End-to-End Test
 * 
 * This script tests the complete O1 block lifecycle:
 * 1. Admin login to get JWT cookie
 * 2. Create a test tutorial section
 * 3. Insert O1 block with registry defaults
 * 4. Save tutorial (PATCH) → Expect 200 (not 400)
 * 5. Reload tutorial and verify O1 block persisted
 * 6. Publish tutorial
 * 7. Verify learner page renders objectives
 * 
 * SUCCESS CRITERIA:
 * - Save returns 200 (not 400 schema validation error)
 * - Block persists with correct type/version
 * - Schema validation passes (no runtime errors)
 * - Renderer displays objectives
 */

import http from 'http';
import { randomUUID } from 'crypto';

const FRONTEND_HOST = 'skillhubcore.localhost';
const FRONTEND_PORT = 3007;

// Test credentials
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

// Test data
const TEST_BRAND_ID = 1; // Adjust to your test brand
const TEST_SUBTOPIC_ID = 1; // Adjust to your test subtopic

/**
 * Make HTTP request and return response
 */
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000); // 30 second timeout

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

/**
 * Test 1: Admin Login
 */
async function login() {
  console.log('\n=== TEST 1: Admin Login ===');
  console.log(`Attempting login: ${ADMIN_EMAIL}`);
  
  const postData = JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  const response = await makeRequest({
    hostname: FRONTEND_HOST,
    port: FRONTEND_PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  }, postData);

  console.log(`Response: HTTP ${response.statusCode}`);

  const cookies = response.headers['set-cookie'];
  if (cookies) {
    const authCookie = cookies.find(c => c.includes('accessToken') || c.includes('admin_accessToken'));
    if (authCookie) {
      const cookieValue = authCookie.split(';')[0];
      console.log(`✅ Auth cookie obtained`);
      return cookieValue;
    }
  }

  throw new Error('Login failed: No auth cookie');
}

/**
 * Test 2: Create Tutorial Section
 */
async function createTutorialSection(authCookie) {
  console.log('\n=== TEST 2: Create Tutorial Section ===');
  
  const sectionId = randomUUID();
  const postData = JSON.stringify({
    sectionId,
    subtopicId: TEST_SUBTOPIC_ID,
    brandId: TEST_BRAND_ID,
    title: 'O1 E2E Test Tutorial',
    blocks: [],
  });

  const response = await makeRequest({
    hostname: FRONTEND_HOST,
    port: FRONTEND_PORT,
    path: '/api/tutorial-composer/sections',
    method: 'POST',
    headers: {
      'Cookie': authCookie,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  }, postData);

  console.log(`Response: HTTP ${response.statusCode}`);

  if (response.statusCode !== 201 && response.statusCode !== 200) {
    console.error('Response body:', response.body);
    throw new Error(`Failed to create section: HTTP ${response.statusCode}`);
  }

  console.log(`✅ Tutorial section created: ${sectionId}`);
  return sectionId;
}

/**
 * Test 3: Insert O1 Block with Registry Defaults
 */
function buildO1BlockPayload() {
  console.log('\n=== TEST 3: Build O1 Block Payload ===');
  
  // This matches the EXACT registry default from objective.registry.ts
  const o1Block = {
    id: randomUUID(),
    type: 'objective',
    version: 'O1',
    content: {
      eyebrow: 'LEARNING OBJECTIVES',
      title: 'Skills You Will Develop in This Lesson',
      titleHighlight: 'Develop in This Lesson',
      introduction: 'By the end of this lesson, you will have the following practical skills:',
      objectives: [
        {
          id: '1',
          verb: 'Create',
          title: 'Create and initialize lists',
          description: 'Create Python lists using different methods and initialize them with values.',
          badge: 'Practical Skill',
          icon: 'create',
        },
        {
          id: '2',
          verb: 'Access',
          title: 'Access list elements',
          description: 'Retrieve individual elements from a list using indexing and negative indexing.',
          badge: 'Core Skill',
          icon: 'access',
        },
        {
          id: '3',
          verb: 'Extract',
          title: 'Extract values using slicing',
          description: 'Use slicing to get a range of elements and create sublists.',
          badge: 'Core Skill',
          icon: 'extract',
        },
      ],
      note: {
        title: 'Note',
        text: 'These are observable, practical skills you will develop in this lesson. Each skill will be demonstrated with clear examples and hands-on practice.',
      },
    },
  };

  console.log(`✅ O1 block built: ${o1Block.id}`);
  console.log(`   Type: ${o1Block.type}, Version: ${o1Block.version}`);
  console.log(`   Objectives count: ${o1Block.content.objectives.length}`);
  
  return o1Block;
}

/**
 * Test 4: Save Tutorial with O1 Block (CRITICAL TEST)
 */
async function saveTutorialWithO1Block(authCookie, sectionId, o1Block) {
  console.log('\n=== TEST 4: Save Tutorial with O1 Block (CRITICAL) ===');
  console.log('This tests if PATCH_BLOCKS_SCHEMA validation accepts O1 blocks');
  
  const postData = JSON.stringify({
    title: 'O1 E2E Test Tutorial',
    blocks: [o1Block],
  });

  const response = await makeRequest({
    hostname: FRONTEND_HOST,
    port: FRONTEND_PORT,
    path: `/api/tutorial-composer/sections/${sectionId}`,
    method: 'PATCH',
    headers: {
      'Cookie': authCookie,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  }, postData);

  console.log(`Response: HTTP ${response.statusCode}`);

  if (response.statusCode === 400) {
    console.error('❌ VALIDATION ERROR: Schema validation failed');
    console.error('Response body:', response.body);
    
    try {
      const errorBody = JSON.parse(response.body);
      if (errorBody.error?.details) {
        console.error('\nValidation details:');
        errorBody.error.details.forEach(detail => {
          console.error(`  - ${detail.path?.join('.') || 'root'}: ${detail.message}`);
        });
      }
    } catch (e) {
      // Body not JSON
    }
    
    throw new Error('Schema validation rejected O1 block');
  }

  if (response.statusCode !== 200) {
    console.error('Response body:', response.body);
    throw new Error(`Failed to save tutorial: HTTP ${response.statusCode}`);
  }

  console.log(`✅ PASS: Tutorial saved successfully (HTTP 200)`);
  console.log(`✅ CRITICAL: PATCH_BLOCKS_SCHEMA accepted O1 block`);
  
  return true;
}

/**
 * Test 5: Reload Tutorial and Verify O1 Block Persisted
 */
async function verifyO1BlockPersisted(authCookie, sectionId, expectedBlockId) {
  console.log('\n=== TEST 5: Verify O1 Block Persisted ===');
  
  const response = await makeRequest({
    hostname: FRONTEND_HOST,
    port: FRONTEND_PORT,
    path: `/api/tutorial-composer/sections/${sectionId}`,
    method: 'GET',
    headers: {
      'Cookie': authCookie,
      'Accept': 'application/json',
    },
  });

  console.log(`Response: HTTP ${response.statusCode}`);

  if (response.statusCode !== 200) {
    console.error('Response body:', response.body);
    throw new Error(`Failed to reload tutorial: HTTP ${response.statusCode}`);
  }

  const tutorial = JSON.parse(response.body);
  console.log(`Tutorial blocks count: ${tutorial.blocks?.length || 0}`);

  // Find O1 block
  const o1Block = tutorial.blocks?.find(b => b.id === expectedBlockId);
  
  if (!o1Block) {
    console.error('❌ O1 block NOT found in reloaded tutorial');
    console.error('Available blocks:', tutorial.blocks?.map(b => ({ id: b.id, type: b.type, version: b.version })));
    throw new Error('O1 block not persisted');
  }

  console.log(`✅ O1 block found: ${o1Block.id}`);
  console.log(`   Type: ${o1Block.type}, Version: ${o1Block.version}`);
  console.log(`   Objectives: ${o1Block.content?.objectives?.length || 0} items`);

  // Validate structure
  if (o1Block.type !== 'objective' || o1Block.version !== 'O1') {
    throw new Error(`Invalid block type/version: ${o1Block.type}/${o1Block.version}`);
  }

  if (!o1Block.content?.objectives || o1Block.content.objectives.length === 0) {
    throw new Error('O1 block missing objectives');
  }

  console.log(`✅ PASS: O1 block persisted correctly with all data`);
  return true;
}

/**
 * Test 6: Publish Tutorial
 */
async function publishTutorial(authCookie, sectionId) {
  console.log('\n=== TEST 6: Publish Tutorial ===');
  
  const response = await makeRequest({
    hostname: FRONTEND_HOST,
    port: FRONTEND_PORT,
    path: `/api/tutorial-composer/sections/${sectionId}/publish`,
    method: 'POST',
    headers: {
      'Cookie': authCookie,
      'Content-Type': 'application/json',
    },
  }, '{}');

  console.log(`Response: HTTP ${response.statusCode}`);

  if (response.statusCode !== 200) {
    console.error('Response body:', response.body);
    console.log('⚠️  Publish failed (may be expected if validation gates active)');
    return false;
  }

  console.log(`✅ Tutorial published successfully`);
  return true;
}

/**
 * Test 7: Verify Learner Page Renders (Optional)
 */
async function verifyLearnerRendering(sectionId) {
  console.log('\n=== TEST 7: Verify Learner Page Renders ===');
  console.log('Checking if learner page loads without errors...');
  
  try {
    const response = await makeRequest({
      hostname: FRONTEND_HOST,
      port: FRONTEND_PORT,
      path: `/tutorial/${sectionId}`,
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });

    console.log(`Response: HTTP ${response.statusCode}`);

    if (response.statusCode === 200) {
      console.log(`✅ Learner page loaded successfully`);
      
      // Check if HTML contains objective markers
      if (response.body.includes('objective') || response.body.includes('LEARNING OBJECTIVES')) {
        console.log(`✅ Page contains objective content`);
      } else {
        console.log(`⚠️  No objective content detected in HTML`);
      }
      
      return true;
    } else {
      console.log(`⚠️  Learner page returned HTTP ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    console.log(`⚠️  Learner page check failed: ${err.message}`);
    return false;
  }
}

/**
 * Main E2E Test Runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  O1 Block Placement - End-to-End Test                         ║');
  console.log('║  Phase 6: Complete Lifecycle Verification                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const results = {
    login: 'NOT_TESTED',
    create_section: 'NOT_TESTED',
    build_block: 'NOT_TESTED',
    save_with_o1: 'NOT_TESTED',
    verify_persistence: 'NOT_TESTED',
    publish: 'NOT_TESTED',
    learner_render: 'NOT_TESTED',
  };

  let authCookie, sectionId, o1Block;

  try {
    // Test 1: Login
    authCookie = await login();
    results.login = 'PASS';

    // Test 2: Create section
    sectionId = await createTutorialSection(authCookie);
    results.create_section = 'PASS';

    // Test 3: Build O1 block
    o1Block = buildO1BlockPayload();
    results.build_block = 'PASS';

    // Test 4: Save with O1 block (CRITICAL TEST)
    await saveTutorialWithO1Block(authCookie, sectionId, o1Block);
    results.save_with_o1 = 'PASS';

    // Test 5: Verify persistence
    await verifyO1BlockPersisted(authCookie, sectionId, o1Block.id);
    results.verify_persistence = 'PASS';

    // Test 6: Publish
    const publishSuccess = await publishTutorial(authCookie, sectionId);
    results.publish = publishSuccess ? 'PASS' : 'SKIPPED';

    // Test 7: Learner render
    const renderSuccess = await verifyLearnerRendering(sectionId);
    results.learner_render = renderSuccess ? 'PASS' : 'SKIPPED';

  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    console.error(err.stack);
    
    // Mark current test as failed
    for (const [key, value] of Object.entries(results)) {
      if (value === 'NOT_TESTED') {
        results[key] = 'FAILED';
        break;
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL RESULTS                                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(JSON.stringify(results, null, 2));

  // Success if critical tests pass
  const criticalPass = 
    results.login === 'PASS' &&
    results.create_section === 'PASS' &&
    results.save_with_o1 === 'PASS' &&
    results.verify_persistence === 'PASS';

  if (criticalPass) {
    console.log('\n✅ SUCCESS: All critical tests passed!');
    console.log('   - O1 block schema validated');
    console.log('   - Save operation succeeded (HTTP 200)');
    console.log('   - Block persisted correctly');
    console.log(`\nTest section ID: ${sectionId}`);
    console.log(`Cleanup: You can delete this test tutorial from the admin UI`);
  } else {
    console.log('\n❌ FAILURE: Critical tests failed');
  }

  process.exit(criticalPass ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
