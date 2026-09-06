/**
 * GATE 4K — API SMOKE TEST
 * 
 * Minimum smoke test for Phase 4.4 block-level ILS APIs.
 * Tests actual authentication chain: HTTP → App Router → Service → Repository → PostgreSQL
 * 
 * DOES NOT bypass authentication.
 * DOES NOT mock endpoints.
 * DOES NOT modify production code.
 */

import { login, testCredentials, getInternalApiHeaders } from './auth-helper.mjs';
import pg from 'pg';

const { Client } = pg;

// API server endpoint
const API_SERVER_BASE = 'http://localhost:3000';

// Test data
const TEST_DATA = {
  navigationNodeId: 'whatisjava',
  subtopicId: '5326eeb6-c4c8-4218-9687-2b46f94a9bb4', // Must exist in tutorial_navigation_progress
  blockId: 'gate-4k-smoke-test-block',
  blockVersion: 'D1',
  sessionId: `gate-4k-${Date.now()}`,
  activeTimeSec: 15,
};

async function runSmokeTest() {
  console.log('==================================================');
  console.log('GATE 4K — API SMOKE TEST');
  console.log('==================================================\n');

  let dbClient = null;

  try {
    // Step 1: Authentication
    console.log('STEP 1: Authenticate user');
    const authResult = await login(testCredentials.realtutorialhub);
    
    if (!authResult.success || !authResult.userId) {
      console.error('✗ Authentication failed:', authResult.error);
      process.exit(1);
    }
    
    console.log('✓ Authentication successful');
    console.log(`  User ID: ${authResult.userId}`);
    console.log();

    // Step 2: Prepare headers
    const headers = getInternalApiHeaders(
      authResult.userId,
      testCredentials.realtutorialhub.brand
    );
    
    // Add CSRF bypass header
    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) {
      console.error('✗ INTERNAL_API_KEY not configured');
      process.exit(1);
    }
    headers['X-Internal-Key'] = internalKey;
    
    console.log('STEP 2: Internal API headers prepared');
    console.log(`  X-Internal-Secret: ${headers['X-Internal-Secret'].substring(0, 20)}...`);
    console.log(`  X-Internal-Key: ${headers['X-Internal-Key'].substring(0, 20)}...`);
    console.log(`  X-User-ID: ${headers['X-User-ID']}`);
    console.log(`  X-Brand: ${headers['X-Brand']}`);
    console.log();

    // Step 3: POST /api/tutorial/ils/block-visit
    console.log('STEP 3: POST /api/tutorial/ils/block-visit');
    const visitPayload = {
      navigationNodeId: TEST_DATA.navigationNodeId,
      subtopicId: TEST_DATA.subtopicId,
      blockId: TEST_DATA.blockId,
      blockVersion: TEST_DATA.blockVersion,
      sessionId: TEST_DATA.sessionId,
    };
    
    console.log('  Payload:', JSON.stringify(visitPayload, null, 2));
    
    const visitResponse = await fetch(`${API_SERVER_BASE}/api/tutorial/ils/block-visit`, {
      method: 'POST',
      headers: {
        ...headers,
        'X-Session-Id': TEST_DATA.sessionId,
      },
      body: JSON.stringify(visitPayload),
    });

    console.log(`  Response status: ${visitResponse.status}`);
    
    const visitBody = await visitResponse.json();
    console.log('  Response body:', JSON.stringify(visitBody, null, 2));

    if (visitResponse.status !== 200) {
      console.error('✗ Block visit failed');
      process.exit(1);
    }

    console.log('✓ Block visit recorded');
    console.log();

    // Step 4: POST /api/tutorial/ils/block-active-time
    console.log('STEP 4: POST /api/tutorial/ils/block-active-time');
    const timePayload = {
      navigationNodeId: TEST_DATA.navigationNodeId,
      subtopicId: TEST_DATA.subtopicId,
      blockId: TEST_DATA.blockId,
      blockVersion: TEST_DATA.blockVersion,
      activeTimeSec: TEST_DATA.activeTimeSec,
    };
    
    console.log('  Payload:', JSON.stringify(timePayload, null, 2));
    
    const timeResponse = await fetch(`${API_SERVER_BASE}/api/tutorial/ils/block-active-time`, {
      method: 'POST',
      headers,
      body: JSON.stringify(timePayload),
    });

    console.log(`  Response status: ${timeResponse.status}`);
    
    const timeBody = await timeResponse.json();
    console.log('  Response body:', JSON.stringify(timeBody, null, 2));

    if (timeResponse.status !== 200) {
      console.error('✗ Block active time recording failed');
      process.exit(1);
    }

    console.log('✓ Block active time recorded');
    console.log();

    // Step 5: Database verification
    console.log('STEP 5: Database verification');
    dbClient = new Client({
      connectionString: process.env.DATABASE_URL_TUTORIAL,
    });
    
    await dbClient.connect();
    console.log('✓ Database connected');

    const query = `
      SELECT 
        id,
        user_id,
        brand,
        navigation_node_id,
        subtopic_id,
        block_id,
        block_version,
        visit_count,
        cumulative_active_time_sec,
        last_visit_at,
        created_at,
        updated_at
      FROM block_learning_state
      WHERE user_id = $1
        AND brand = $2
        AND navigation_node_id = $3
        AND subtopic_id = $4
        AND block_id = $5
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const result = await dbClient.query(query, [
      authResult.userId,
      testCredentials.realtutorialhub.brand,
      TEST_DATA.navigationNodeId,
      TEST_DATA.subtopicId,
      TEST_DATA.blockId,
    ]);

    if (result.rows.length === 0) {
      console.error('✗ No block_learning_state record found');
      process.exit(1);
    }

    const record = result.rows[0];
    console.log('✓ Database record found:');
    console.log(`  ID: ${record.id}`);
    console.log(`  User ID: ${record.user_id}`);
    console.log(`  Brand: ${record.brand}`);
    console.log(`  Navigation Node ID: ${record.navigation_node_id}`);
    console.log(`  Subtopic ID: ${record.subtopic_id}`);
    console.log(`  Block ID: ${record.block_id}`);
    console.log(`  Block Version: ${record.block_version}`);
    console.log(`  Visit Count: ${record.visit_count}`);
    console.log(`  Cumulative Active Time: ${record.cumulative_active_time_sec}s`);
    console.log(`  Last Visit: ${record.last_visit_at}`);
    console.log(`  Created: ${record.created_at}`);
    console.log(`  Updated: ${record.updated_at}`);
    console.log();

    // Step 6: Validation
    console.log('STEP 6: Validation');
    const validations = [];

    if (record.visit_count >= 1) {
      console.log('✓ Visit count >= 1');
      validations.push(true);
    } else {
      console.error(`✗ Visit count invalid: ${record.visit_count}`);
      validations.push(false);
    }

    if (record.cumulative_active_time_sec >= TEST_DATA.activeTimeSec) {
      console.log(`✓ Cumulative time >= ${TEST_DATA.activeTimeSec}s`);
      validations.push(true);
    } else {
      console.error(`✗ Cumulative time invalid: ${record.cumulative_active_time_sec}s`);
      validations.push(false);
    }

    if (record.block_version === TEST_DATA.blockVersion) {
      console.log(`✓ Block version matches: ${TEST_DATA.blockVersion}`);
      validations.push(true);
    } else {
      console.error(`✗ Block version mismatch: expected ${TEST_DATA.blockVersion}, got ${record.block_version}`);
      validations.push(false);
    }

    console.log();

    if (validations.every(v => v)) {
      console.log('==================================================');
      console.log('GATE 4K — PASS');
      console.log('==================================================');
      console.log();
      console.log('Chain verified:');
      console.log('  HTTP request');
      console.log('      ↓');
      console.log('  App Router route');
      console.log('      ↓');
      console.log('  Internal authentication');
      console.log('      ↓');
      console.log('  LearningProgressService');
      console.log('      ↓');
      console.log('  BlockLearningStateRepository');
      console.log('      ↓');
      console.log('  PostgreSQL (tutorial_prod)');
      console.log();
      process.exit(0);
    } else {
      console.log('==================================================');
      console.log('GATE 4K — FAIL');
      console.log('==================================================');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Smoke test failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    if (dbClient) {
      await dbClient.end();
    }
  }
}

runSmokeTest();
