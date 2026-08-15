#!/usr/bin/env node
/**
 * Tutorial Composer - Block Suggestions API Integration Test
 * 
 * Tests the POST /api/tutorial-composer/block-suggestions endpoint
 * 
 * TESTS:
 * 1. Authentication (401)
 * 2. Authorization (403)
 * 3. Validation (422)
 * 4. Success (200) with valid TutorialDocument
 * 5. Success with ContentAnalysisResult optimization
 * 
 * USAGE:
 *   node scripts/test-block-suggestions-api.mjs
 * 
 * REQUIREMENTS:
 * - API server running at admin.skillhubcore.in
 * - Valid admin credentials
 * - Test subtopic exists
 */

import https from 'https';

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = 'https://admin.skillhubcore.in';
const TEST_EMAIL = 'admin@skillhubcore.in';
const TEST_PASSWORD = 'testing';

// Test subtopic (from existing system)
const TEST_SUBTOPIC_ID = '123e4567-e89b-12d3-a456-426614174000'; // Replace with real UUID

// ============================================================
// TEST DATA
// ============================================================

const SAMPLE_DOCUMENT = {
  id: 'test-block-suggestions-doc',
  version: '1.0.0',
  title: 'JavaScript Environments',
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      level: 2,
      text: 'Where JavaScript Runs',
    },
    {
      id: 'heading-2',
      type: 'heading',
      level: 3,
      text: 'Client-Side JavaScript',
    },
    {
      id: 'para-1',
      type: 'paragraph',
      text: 'JavaScript runs in the browser environment, interacting with the DOM.',
    },
    {
      id: 'heading-3',
      type: 'heading',
      level: 3,
      text: 'Server-Side JavaScript',
    },
    {
      id: 'para-2',
      type: 'paragraph',
      text: 'Node.js enables JavaScript to run on the server, handling HTTP requests.',
    },
    {
      id: 'para-3',
      type: 'paragraph',
      text: 'Note: Always validate user input on the server side for security.',
    },
    {
      id: 'para-4',
      type: 'paragraph',
      text: 'For example, you can use Express.js to build web servers with Node.js.',
    },
    {
      id: 'comparison',
      type: 'paragraph',
      text: 'The main difference between client-side and server-side is the execution environment.',
    },
  ],
};

// ============================================================
// HTTP HELPER
// ============================================================

function makeRequest(method, path, body = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const setCookies = res.headers['set-cookie'] || [];
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
          cookies: setCookies,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================================
// AUTHENTICATION HELPER
// ============================================================

async function login(email, password) {
  console.log('🔐 Logging in...');
  
  const response = await makeRequest('POST', '/api/auth/login', {
    email,
    password,
  });

  if (response.statusCode !== 200) {
    throw new Error(`Login failed: ${response.statusCode}`);
  }

  // Extract cookies
  const cookies = response.cookies
    .map((c) => c.split(';')[0])
    .join('; ');

  console.log('✅ Login successful\n');
  return cookies;
}

// ============================================================
// TEST CASES
// ============================================================

async function testUnauthenticated() {
  console.log('TEST 1: Unauthenticated Request (401)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const response = await makeRequest(
    'POST',
    '/api/tutorial-composer/block-suggestions',
    {
      document: SAMPLE_DOCUMENT,
      subtopicId: TEST_SUBTOPIC_ID,
      sectionType: 'notes',
      brandId: 'skillhubcore',
    }
  );

  const passed = response.statusCode === 401;
  console.log(`Status: ${response.statusCode}`);
  console.log(`Expected: 401`);
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!passed) {
    console.log('Response:', JSON.stringify(response.body, null, 2));
  }
  
  console.log('');
  return passed;
}

async function testInvalidDocument(cookies) {
  console.log('TEST 2: Invalid TutorialDocument (422)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const response = await makeRequest(
    'POST',
    '/api/tutorial-composer/block-suggestions',
    {
      document: {
        // Missing required fields
        blocks: [],
      },
      subtopicId: TEST_SUBTOPIC_ID,
    },
    cookies
  );

  const passed = response.statusCode === 422;
  console.log(`Status: ${response.statusCode}`);
  console.log(`Expected: 422`);
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!passed) {
    console.log('Response:', JSON.stringify(response.body, null, 2));
  }
  
  console.log('');
  return passed;
}

async function testSuccessBasic(cookies) {
  console.log('TEST 3: Valid Request - Basic (200)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const startTime = Date.now();
  
  const response = await makeRequest(
    'POST',
    '/api/tutorial-composer/block-suggestions',
    {
      document: SAMPLE_DOCUMENT,
      subtopicId: TEST_SUBTOPIC_ID,
      sectionType: 'notes',
      brandId: 'skillhubcore',
    },
    cookies
  );

  const duration = Date.now() - startTime;

  const passed = response.statusCode === 200;
  console.log(`Status: ${response.statusCode}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Expected: 200`);
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  if (passed) {
    const result = response.body.data;
    
    console.log('\n📊 Suggestion Statistics:');
    console.log(`  Total Blocks: ${result.statistics.totalBlocks}`);
    console.log(`  Existing: ${result.statistics.existingBlocks}`);
    console.log(`  Suggested: ${result.statistics.suggestedBlocks}`);
    console.log(`  High Confidence: ${result.statistics.highConfidence}`);
    console.log(`  Medium Confidence: ${result.statistics.mediumConfidence}`);
    console.log(`  Low Confidence: ${result.statistics.lowConfidence}`);
    console.log(`  Overall Confidence: ${result.overallConfidence}%`);

    console.log('\n🔍 Sample Suggestions:');
    result.blocks
      .filter((b) => b.kind === 'suggested')
      .slice(0, 5)
      .forEach((suggestion, i) => {
        console.log(`\n  ${i + 1}. ${suggestion.title} (${suggestion.blockType})`);
        console.log(`     Confidence: ${suggestion.confidence}% (${suggestion.confidenceLevel})`);
        console.log(`     Reason: ${suggestion.reason}`);
        console.log(`     Source Blocks: ${suggestion.sourceBlockIds.length}`);
      });

    // Validation checks
    console.log('\n✓ Validation Checks:');
    
    const checks = [
      {
        name: 'Has statistics',
        pass: !!result.statistics,
      },
      {
        name: 'Has blocks array',
        pass: Array.isArray(result.blocks),
      },
      {
        name: 'Has existing blocks',
        pass: result.statistics.existingBlocks > 0,
      },
      {
        name: 'Has suggested blocks',
        pass: result.statistics.suggestedBlocks > 0,
      },
      {
        name: 'Overall confidence valid',
        pass: result.overallConfidence >= 0 && result.overallConfidence <= 100,
      },
      {
        name: 'All suggestions have reason',
        pass: result.blocks.every((b) => b.reason && b.reason.length > 0),
      },
      {
        name: 'All suggestions have confidence',
        pass: result.blocks.every((b) => b.confidence >= 0 && b.confidence <= 100),
      },
      {
        name: 'All suggestions have confidenceLevel',
        pass: result.blocks.every((b) => ['high', 'medium', 'low'].includes(b.confidenceLevel)),
      },
    ];

    checks.forEach((check) => {
      console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allChecksPassed = checks.every((c) => c.pass);
    if (!allChecksPassed) {
      console.log('\n⚠️  Some validation checks failed');
      return false;
    }
  } else {
    console.log('Response:', JSON.stringify(response.body, null, 2));
  }

  console.log('');
  return passed;
}

async function testSuccessWithAnalysis(cookies) {
  console.log('TEST 4: Valid Request - With Analysis Optimization (200)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // First get analysis result (simulate Prompt 06 flow)
  const analysisResponse = await makeRequest(
    'POST',
    '/api/tutorial-composer/analysis',
    {
      document: SAMPLE_DOCUMENT,
      subtopicId: TEST_SUBTOPIC_ID,
      brandId: 'skillhubcore',
    },
    cookies
  );

  if (analysisResponse.statusCode !== 200) {
    console.log('❌ FAIL - Could not get analysis result');
    console.log('Response:', JSON.stringify(analysisResponse.body, null, 2));
    console.log('');
    return false;
  }

  const analysisResult = analysisResponse.body.data;

  // Now call block suggestions with analysis
  const startTime = Date.now();
  
  const response = await makeRequest(
    'POST',
    '/api/tutorial-composer/block-suggestions',
    {
      document: SAMPLE_DOCUMENT,
      analysis: analysisResult, // ← Optimization: reuse analysis
      subtopicId: TEST_SUBTOPIC_ID,
      sectionType: 'notes',
      brandId: 'skillhubcore',
    },
    cookies
  );

  const duration = Date.now() - startTime;

  const passed = response.statusCode === 200;
  console.log(`Status: ${response.statusCode}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Expected: 200`);
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  if (passed) {
    const result = response.body.data;
    console.log('\n📊 With Analysis Optimization:');
    console.log(`  Total Blocks: ${result.statistics.totalBlocks}`);
    console.log(`  Suggested: ${result.statistics.suggestedBlocks}`);
    console.log(`  Overall Confidence: ${result.overallConfidence}%`);
  } else {
    console.log('Response:', JSON.stringify(response.body, null, 2));
  }

  console.log('');
  return passed;
}

async function testDeterminism(cookies) {
  console.log('TEST 5: Determinism - Same Input → Same Output');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const request = {
    document: SAMPLE_DOCUMENT,
    subtopicId: TEST_SUBTOPIC_ID,
    sectionType: 'notes',
    brandId: 'skillhubcore',
  };

  // Make 3 identical requests
  const [response1, response2, response3] = await Promise.all([
    makeRequest('POST', '/api/tutorial-composer/block-suggestions', request, cookies),
    makeRequest('POST', '/api/tutorial-composer/block-suggestions', request, cookies),
    makeRequest('POST', '/api/tutorial-composer/block-suggestions', request, cookies),
  ]);

  const allSuccess = [response1, response2, response3].every((r) => r.statusCode === 200);

  if (!allSuccess) {
    console.log('❌ FAIL - Not all requests succeeded');
    console.log('');
    return false;
  }

  // Compare results (excluding timestamps)
  const normalize = (result) => ({
    ...result,
    metadata: undefined,
  });

  const result1 = normalize(response1.body.data);
  const result2 = normalize(response2.body.data);
  const result3 = normalize(response3.body.data);

  const result1Str = JSON.stringify(result1);
  const result2Str = JSON.stringify(result2);
  const result3Str = JSON.stringify(result3);

  const passed = result1Str === result2Str && result2Str === result3Str;

  console.log(`Run 1 blocks: ${response1.body.data.statistics.totalBlocks}`);
  console.log(`Run 2 blocks: ${response2.body.data.statistics.totalBlocks}`);
  console.log(`Run 3 blocks: ${response3.body.data.statistics.totalBlocks}`);
  console.log(`Results match: ${passed ? 'Yes' : 'No'}`);
  console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  console.log('');
  return passed;
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TUTORIAL COMPOSER - BLOCK SUGGESTIONS API TEST           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  try {
    // Test 1: Unauthenticated
    results.total++;
    if (await testUnauthenticated()) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Login for authenticated tests
    const cookies = await login(TEST_EMAIL, TEST_PASSWORD);

    // Test 2: Invalid document
    results.total++;
    if (await testInvalidDocument(cookies)) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 3: Success basic
    results.total++;
    if (await testSuccessBasic(cookies)) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 4: Success with analysis
    results.total++;
    if (await testSuccessWithAnalysis(cookies)) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 5: Determinism
    results.total++;
    if (await testDeterminism(cookies)) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Summary
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  TEST SUMMARY                                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('');

    if (results.failed === 0) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

main();
