/**
 * GATE 3C.1R — FINAL HTTP RUNTIME CLOSURE
 * Step: HTTP Navigation Progress GET Endpoint Verification
 * 
 * Purpose: Prove the real HTTP API → Service → Repository → Database read path
 * for navigation progress with blocks[] telemetry.
 * 
 * VERIFIED API ROUTE:
 * GET /api/tutorial/ils/navigation/:nodeId?subtopicId=xxx
 * 
 * This route invokes LearningProgressService.getNavigationProgress()
 * 
 * IMPORTANT: This is a READ-ONLY test using existing data.
 * Does NOT call write endpoints (visit, active-time, completion).
 */

import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load environment BEFORE importing modules
dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

/**
 * Known verified data from Phase C closure
 */
const TEST_DATA = {
  navigationNodeId: 'whatisjava',
  subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
  userId: '54726a2e-fca5-4d93-abc6-e7cee97a86f8',
  brand: 'realtutorialhub',
  expectedD1BlockId: '79ae6e0f-0374-4dfe-8d76-cefbe42f8996',
  expectedC1BlockId: 'fb6b1e9d-3fe2-48f5-891e-73f8e22797b9',
};

/**
 * API configuration
 * Use localhost for development HTTP test
 */
const API_BASE_URL = 'http://localhost:3000';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

/**
 * Required telemetry fields from Phase C contract
 */
const REQUIRED_FIELDS = [
  'blockId',
  'blockVersion',
  'visitCount',
  'revisionCount',
  'activeTimeSec',
  'expectedTimeSec',
  'firstViewedAt',
  'lastViewedAt',
  'completedAt',
] as const;

/**
 * Simple assertion helper
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

/**
 * HTTP JSON helper
 */
async function getJson(
  url: string,
  headers: Record<string, string>
): Promise<{
  response: Response;
  body: any;
}> {
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  const text = await response.text();

  let body: any = null;

  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    response,
    body,
  };
}

/**
 * Verify all required block telemetry fields
 */
function verifyBlockFields(block: any, label: string): void {
  for (const field of REQUIRED_FIELDS) {
    assert(
      Object.prototype.hasOwnProperty.call(block, field),
      `${label} contains ${field}`
    );
  }
}

async function main() {
  console.log('================================================================================');
  console.log('GATE 3C.1R — FINAL HTTP RUNTIME VERIFICATION');
  console.log('================================================================================');
  console.log();
  console.log(`API base URL: ${API_BASE_URL}`);
  console.log(`Route: GET /api/tutorial/ils/navigation/:nodeId`);
  console.log(`Navigation node: ${TEST_DATA.navigationNodeId}`);
  console.log(`Subtopic: ${TEST_DATA.subtopicId}`);
  console.log(`User: ${TEST_DATA.userId}`);
  console.log(`Brand: ${TEST_DATA.brand}`);
  console.log();

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Verify configuration
    if (!INTERNAL_SECRET) {
      throw new Error(
        'Missing INTERNAL_API_SECRET environment variable required for Gate 3C.1R HTTP verification'
      );
    }

    // Construct URL for navigation progress endpoint
    const url = new URL(
      `/api/tutorial/ils/navigation/${TEST_DATA.navigationNodeId}`,
      API_BASE_URL
    );
    url.searchParams.set('subtopicId', TEST_DATA.subtopicId);

    console.log('--------------------------------------------------------------------------------');
    console.log('HTTP RUNTIME TESTS');
    console.log('--------------------------------------------------------------------------------');
    console.log();

    // TEST H1-H10: Authenticated request
    console.log('=== AUTHENTICATED REQUEST ===');
    console.log();

    const headers = {
      'x-internal-secret': INTERNAL_SECRET,
      'x-user-id': TEST_DATA.userId,
      'x-brand': TEST_DATA.brand,
      'Accept': 'application/json',
    };

    const { response, body } = await getJson(url.toString(), headers);

    // H1: HTTP 200
    try {
      if (response.status !== 200) {
        console.log();
        console.log('Response body:');
        console.log(JSON.stringify(body, null, 2));
        console.log();
      }
      assert(
        response.status === 200,
        `H1: authenticated navigation-progress request returns HTTP 200 (received ${response.status})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    // H2: JSON response
    try {
      const contentType = response.headers.get('content-type') ?? '';
      assert(
        contentType.includes('application/json'),
        `H2: response is JSON (content-type: ${contentType})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();

    // H3: Response wrapper
    try {
      assert(
        body !== null && typeof body === 'object' && !Array.isArray(body),
        'H3: navigation-progress response is a JSON object'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    // Extract data from wrapper (API returns { data: progress })
    const result = body.data;

    try {
      assert(
        result !== undefined && result !== null,
        'H3b: response contains data wrapper'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();

    // H4: blocks[] exists
    try {
      assert(
        Array.isArray(result.blocks),
        'H4: navigation-progress response contains blocks[]'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    // H5: blocks[] populated
    try {
      assert(
        result.blocks.length >= 2,
        `H5: blocks[] contains at least D1 and C1 (received ${result.blocks.length})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();

    // H6: Find D1
    const d1 = result.blocks.find(
      (block: any) => block.blockId === TEST_DATA.expectedD1BlockId
    );

    try {
      assert(d1 !== undefined, 'H6: D1 exists in blocks[]');
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    try {
      assert(
        d1.blockVersion === 'D1',
        `H6b: D1 blockVersion is D1 (received ${d1.blockVersion})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    // H7: Find C1
    const c1 = result.blocks.find(
      (block: any) => block.blockId === TEST_DATA.expectedC1BlockId
    );

    try {
      assert(c1 !== undefined, 'H7: C1 exists in blocks[]');
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    try {
      assert(
        c1.blockVersion === 'C1',
        `H7b: C1 blockVersion is C1 (received ${c1.blockVersion})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();

    // H8: DTO fields preserved
    try {
      verifyBlockFields(d1, 'D1');
      console.log('H8a: D1 contains all 9 required telemetry fields');
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    try {
      verifyBlockFields(c1, 'C1');
      console.log('H8b: C1 contains all 9 required telemetry fields');
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();

    // H9: Telemetry values survived HTTP serialization
    try {
      assert(
        typeof d1.visitCount === 'number' && d1.visitCount >= 1,
        `H9a: D1 visitCount contains persisted telemetry (received ${d1.visitCount})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    try {
      assert(
        typeof d1.activeTimeSec === 'number' && d1.activeTimeSec >= 0,
        `H9b: D1 activeTimeSec contains persisted telemetry (received ${d1.activeTimeSec})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    try {
      assert(
        typeof c1.visitCount === 'number' && c1.visitCount >= 1,
        `H9c: C1 visitCount contains persisted telemetry (received ${c1.visitCount})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    try {
      assert(
        typeof c1.activeTimeSec === 'number' && c1.activeTimeSec >= 0,
        `H9d: C1 activeTimeSec contains persisted telemetry (received ${c1.activeTimeSec})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();

    // H10: Universal D1/C1 response
    try {
      assert(
        d1 !== undefined && c1 !== undefined,
        'H10: both D1 and C1 returned through same universal HTTP endpoint'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();
    console.log('=== AUTHENTICATION BOUNDARY TESTS ===');
    console.log();

    // H11: Missing authentication
    const unauthenticatedHeaders = {
      'Accept': 'application/json',
      'x-user-id': TEST_DATA.userId,
      'x-brand': TEST_DATA.brand,
      // NO x-internal-secret
    };

    const unauthenticated = await getJson(url.toString(), unauthenticatedHeaders);

    try {
      assert(
        unauthenticated.response.status === 401,
        `H11: missing internal authentication returns HTTP 401 (received ${unauthenticated.response.status})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    // H12: Invalid authentication
    const invalidAuthHeaders = {
      'Accept': 'application/json',
      'x-internal-secret': 'definitely-invalid-gate-3c1r-secret',
      'x-user-id': TEST_DATA.userId,
      'x-brand': TEST_DATA.brand,
    };

    const invalidAuth = await getJson(url.toString(), invalidAuthHeaders);

    try {
      assert(
        invalidAuth.response.status === 401,
        `H12: invalid internal authentication returns HTTP 401 (received ${invalidAuth.response.status})`
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    // H13: Unauthorized telemetry blocked
    try {
      const unauthBody = unauthenticated.body;
      // Response should NOT contain the authenticated user's blocks
      const hasBlocks = unauthBody && unauthBody.data && Array.isArray(unauthBody.data.blocks);
      assert(
        !hasBlocks,
        'H13: unauthorized request does not expose authenticated user telemetry'
      );
      testsPassed++;
    } catch (e) {
      console.error((e as Error).message);
      testsFailed++;
      throw e;
    }

    console.log();
    console.log('================================================================================');
    console.log('FINAL RESULT');
    console.log('================================================================================');
    console.log();
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    console.log();

    if (testsFailed === 0) {
      console.log('✅ FINAL HTTP RUNTIME VERIFICATION: PASS');
      console.log();
      console.log('Evidence:');
      console.log('- Real HTTP endpoint exercised');
      console.log('- Real authentication boundary exercised');
      console.log('- Real authenticated identity used');
      console.log('- Real navigation hierarchy used');
      console.log('- Real D1 telemetry returned');
      console.log('- Real C1 telemetry returned');
      console.log('- blocks[] survived HTTP serialization');
      console.log('- D1/C1 returned through same universal endpoint');
      console.log('- Unauthorized request rejected');
      console.log('- Unauthorized telemetry access blocked');
      console.log();
      console.log('Sample D1 telemetry:');
      console.log(JSON.stringify({
        blockId: d1.blockId,
        blockVersion: d1.blockVersion,
        visitCount: d1.visitCount,
        activeTimeSec: d1.activeTimeSec,
        expectedTimeSec: d1.expectedTimeSec,
      }, null, 2));
      console.log();
      console.log('Sample C1 telemetry:');
      console.log(JSON.stringify({
        blockId: c1.blockId,
        blockVersion: c1.blockVersion,
        visitCount: c1.visitCount,
        activeTimeSec: c1.activeTimeSec,
        expectedTimeSec: c1.expectedTimeSec,
      }, null, 2));
      console.log();
      console.log('================================================================================');
      process.exitCode = 0;
    } else {
      console.log('❌ FINAL HTTP RUNTIME VERIFICATION: FAIL');
      console.log();
      console.log(`${testsFailed} test(s) failed - see details above`);
      console.log();
      console.log('================================================================================');
      process.exitCode = 1;
    }

  } catch (error) {
    console.error();
    console.error('❌ HTTP RUNTIME TEST FAILED');
    console.error();

    if (error instanceof Error) {
      if ('code' in error && error.code === 'ECONNREFUSED') {
        console.error('🔥 CONNECTION REFUSED');
        console.error();
        console.error('BLOCKED — SkillHubCore API is not running.');
        console.error(`Expected at: ${API_BASE_URL}`);
        console.error();
        console.error('No HTTP runtime verdict can be issued.');
        console.error();
        console.error('To start the API server:');
        console.error('  cd apps/api-server');
        console.error('  npm run dev');
        console.error();
      } else {
        console.error(`Error: ${error.message}`);
        if (error.stack) {
          console.error();
          console.error('Stack trace:');
          console.error(error.stack);
        }
      }
    } else {
      console.error(error);
    }

    console.log();
    console.log('================================================================================');
    process.exitCode = 1;
  }
}

main();
