#!/usr/bin/env node
/**
 * GATE 4K - BLOCK-LEVEL ILS API CERTIFICATION
 * 
 * PURPOSE: Extend proven Phase 2 ILS pattern to Phase 4.4 block-level endpoints
 * 
 * BASELINE: ILS Phase 2 Visit Persistence (commit e3e6ddd0)
 * - Proven authentication: X-Internal-Secret + x-internal-key
 * - Proven test data: whatisjava + what-is-java-12efacf1
 * - Proven user identity: Query people database for real user ID
 * 
 * EXTENSION: Phase 4.4 Block-Level APIs
 * - POST /api/tutorial/ils/block-visit
 * - POST /api/tutorial/ils/block-active-time
 * - Database: block_learning_state
 * 
 * RULES:
 * - Use PROVEN Phase 2 authentication pattern (no invention)
 * - Use PROVEN test data (no random UUIDs)
 * - Query people database for user ID (not from login response)
 * - Verify database records (not just HTTP 200)
 * - Create certification report on success
 * - STOP after Gate 4K (do not proceed to Gate 4L)
 */

import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env.local
config({ path: join(projectRoot, '.env.local'), override: true });

const { Client } = pkg;

// ============================================================================
// PROVEN TEST DATA (from ILS Phase 2 certification)
// ============================================================================

const PROVEN_CONFIG = {
  // Proven from Phase 2 success  
  navigationNodeId: 'whatisjava',  // TEXT SLUG (schema fixed in Phase 2)
  subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',  // Actual UUID from database

  // Try SkillUp brand (Phase 2 tested both SUIA and RTH)
  brand: 'skillup',
  baseUrl: 'http://skillup.localhost:3009',
  apiUrl: 'http://localhost:3000',
  email: 'student@skillupitacademy.com',
  password: 'testing',
  
  // New for Gate 4K block-level testing
  blockId: 'gate-4k-certification-block',
  blockVersion: 'D1',
  activeTimeSec: 30,
};

// Evidence collection
const evidence = {
  step: {
    '1_authentication': false,
    '2_user_id_query': false,
    '3_block_visit_api': false,
    '4_block_active_time_api': false,
    '5_database_verification': false,
  },
  userId: null,
  sessionId: null,
  blockVisitResponse: null,
  blockActiveTimeResponse: null,
  databaseRecord: null,
  errors: [],
  warnings: [],
};

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║   GATE 4K - BLOCK-LEVEL ILS API CERTIFICATION                        ║');
console.log('║   Extension of Proven Phase 2 Pattern                                ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// PROVEN AUTHENTICATION PATTERN (from Phase 2)
// ============================================================================

/**
 * Login (browser-style authentication)
 * Returns: { success, accessToken, userId?, error? }
 */
async function login({ baseUrl, email, password, brand }) {
  try {
    console.log(`  Attempting login: ${email}`);
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand': brand,
      },
      body: JSON.stringify({ email, password }),
      redirect: 'manual',
    });

    console.log(`  Login response: ${response.status}`);

    if (response.status === 200 || response.status === 302) {
      const setCookie = response.headers.get('set-cookie');
      const match = setCookie?.match(/accessToken=([^;]+)/);
      const accessToken = match?.[1];

      if (accessToken) {
        console.log(`  ✓ Access token obtained (length: ${accessToken.length})`);
        return { success: true, accessToken };
      }

      return { success: false, error: 'No access token in response' };
    }

    const body = await response.text();
    return { success: false, error: `HTTP ${response.status}: ${body.substring(0, 100)}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get real user ID from people database (PROVEN PATTERN)
 * Phase 2 explicitly queries people DB, NOT tutorial DB
 */
async function getUserIdFromPeopleDatabase(email) {
  const connString = process.env.DATABASE_URL_PEOPLE;
  
  if (!connString) {
    throw new Error('DATABASE_URL_PEOPLE not configured');
  }

  const client = new Client({ connectionString: connString });
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error(`User not found: ${email}`);
    }

    return result.rows[0].id;
  } finally {
    await client.end();
  }
}

/**
 * Generate session ID (learning session UUID)
 */
function generateSessionId() {
  return `gate-4k-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get internal API headers (PROVEN DUAL-CREDENTIAL PATTERN)
 */
function getInternalApiHeaders(userId, brand, sessionId) {
  const secret = process.env.INTERNAL_API_SECRET;
  const key = process.env.INTERNAL_API_KEY;

  if (!secret) {
    throw new Error('INTERNAL_API_SECRET not configured');
  }
  
  if (!key) {
    throw new Error('INTERNAL_API_KEY not configured');
  }

  return {
    'Content-Type': 'application/json',
    'X-Internal-Secret': secret,      // 64 chars - Internal auth
    'x-internal-key': key,            // 128 chars - CSRF bypass
    'X-User-ID': userId,              // Real user from people DB
    'X-Brand': brand,                 // Brand context
    'X-Session-Id': sessionId,        // Learning session UUID
  };
}

// ============================================================================
// GATE 4K TEST EXECUTION
// ============================================================================

async function main() {
  let dbClient = null;

  try {
    console.log('═'.repeat(70));
    console.log('STEP 1: AUTHENTICATION');
    console.log('═'.repeat(70) + '\n');

    console.log(`Authenticating: ${PROVEN_CONFIG.email}`);
    console.log(`Brand: ${PROVEN_CONFIG.brand}`);
    console.log(`Base URL: ${PROVEN_CONFIG.baseUrl}\n`);

    const authResult = await login({
      baseUrl: PROVEN_CONFIG.baseUrl,
      email: PROVEN_CONFIG.email,
      password: PROVEN_CONFIG.password,
      brand: PROVEN_CONFIG.brand,
    });

    if (!authResult.success) {
      console.log(`❌ Authentication failed: ${authResult.error}\n`);
      evidence.errors.push(`Authentication failed: ${authResult.error}`);
      return;
    }

    console.log('✓ Authentication successful\n');
    evidence.step['1_authentication'] = true;

    // ========================================================================
    // STEP 2: GET REAL USER ID FROM PEOPLE DATABASE (PROVEN PATTERN)
    // ========================================================================

    console.log('═'.repeat(70));
    console.log('STEP 2: QUERY PEOPLE DATABASE FOR USER ID');
    console.log('═'.repeat(70) + '\n');

    console.log('Database: DATABASE_URL_PEOPLE');
    console.log(`Query: SELECT id FROM users WHERE email = '${PROVEN_CONFIG.email}'`);

    const userId = await getUserIdFromPeopleDatabase(PROVEN_CONFIG.email);
    evidence.userId = userId;

    console.log(`✓ User ID obtained: ${userId}\n`);
    evidence.step['2_user_id_query'] = true;

    // Generate learning session ID
    const sessionId = generateSessionId();
    evidence.sessionId = sessionId;
    console.log(`Generated session ID: ${sessionId}\n`);

    // ========================================================================
    // STEP 3: POST /api/tutorial/ils/block-visit
    // ========================================================================

    console.log('═'.repeat(70));
    console.log('STEP 3: POST /api/tutorial/ils/block-visit');
    console.log('═'.repeat(70) + '\n');

    const headers = getInternalApiHeaders(userId, PROVEN_CONFIG.brand, sessionId);

    console.log('Headers:');
    console.log(`  X-Internal-Secret: ${headers['X-Internal-Secret'].substring(0, 20)}...`);
    console.log(`  x-internal-key: ${headers['x-internal-key'].substring(0, 20)}...`);
    console.log(`  X-User-ID: ${headers['X-User-ID']}`);
    console.log(`  X-Brand: ${headers['X-Brand']}`);
    console.log(`  X-Session-Id: ${headers['X-Session-Id']}\n`);

    const visitPayload = {
      navigationNodeId: PROVEN_CONFIG.navigationNodeId,
      subtopicId: PROVEN_CONFIG.subtopicId,
      blockId: PROVEN_CONFIG.blockId,
      blockVersion: PROVEN_CONFIG.blockVersion,
      sessionId: sessionId,
    };

    console.log('Payload:');
    console.log(JSON.stringify(visitPayload, null, 2));
    console.log();

    const visitUrl = `${PROVEN_CONFIG.apiUrl}/api/tutorial/ils/block-visit`;
    console.log(`POST ${visitUrl}\n`);

    const visitResponse = await fetch(visitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(visitPayload),
      signal: AbortSignal.timeout(15000),
    });

    console.log(`Response status: ${visitResponse.status}`);

    const visitBody = await visitResponse.text();
    let visitJson;
    try {
      visitJson = JSON.parse(visitBody);
    } catch {
      visitJson = null;
    }

    console.log(`Response body: ${visitBody.substring(0, 300)}${visitBody.length > 300 ? '...' : ''}\n`);

    if (visitResponse.status === 200) {
      console.log('✓ Block visit API operational\n');
      evidence.step['3_block_visit_api'] = true;
      evidence.blockVisitResponse = visitJson;
    } else {
      console.log(`❌ Block visit failed with ${visitResponse.status}\n`);
      evidence.errors.push(`Block visit returned ${visitResponse.status}`);
      evidence.step['3_block_visit_api'] = false;
      return;
    }

    // ========================================================================
    // STEP 4: POST /api/tutorial/ils/block-active-time
    // ========================================================================

    console.log('═'.repeat(70));
    console.log('STEP 4: POST /api/tutorial/ils/block-active-time');
    console.log('═'.repeat(70) + '\n');

    const activeTimePayload = {
      navigationNodeId: PROVEN_CONFIG.navigationNodeId,
      subtopicId: PROVEN_CONFIG.subtopicId,
      blockId: PROVEN_CONFIG.blockId,
      blockVersion: PROVEN_CONFIG.blockVersion,
      activeTimeSec: PROVEN_CONFIG.activeTimeSec,
    };

    console.log('Payload:');
    console.log(JSON.stringify(activeTimePayload, null, 2));
    console.log();

    const activeTimeUrl = `${PROVEN_CONFIG.apiUrl}/api/tutorial/ils/block-active-time`;
    console.log(`POST ${activeTimeUrl}\n`);

    const activeTimeResponse = await fetch(activeTimeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(activeTimePayload),
      signal: AbortSignal.timeout(15000),
    });

    console.log(`Response status: ${activeTimeResponse.status}`);

    const activeTimeBody = await activeTimeResponse.text();
    let activeTimeJson;
    try {
      activeTimeJson = JSON.parse(activeTimeBody);
    } catch {
      activeTimeJson = null;
    }

    console.log(`Response body: ${activeTimeBody.substring(0, 300)}${activeTimeBody.length > 300 ? '...' : ''}\n`);

    if (activeTimeResponse.status === 200) {
      console.log('✓ Block active time API operational\n');
      evidence.step['4_block_active_time_api'] = true;
      evidence.blockActiveTimeResponse = activeTimeJson;
    } else {
      console.log(`❌ Block active time failed with ${activeTimeResponse.status}\n`);
      evidence.errors.push(`Block active time returned ${activeTimeResponse.status}`);
      evidence.step['4_block_active_time_api'] = false;
      return;
    }

    // ========================================================================
    // STEP 5: DATABASE VERIFICATION
    // ========================================================================

    console.log('═'.repeat(70));
    console.log('STEP 5: DATABASE VERIFICATION');
    console.log('═'.repeat(70) + '\n');

    console.log('Connecting to tutorial database...');
    const tutorialConnString = process.env.DATABASE_URL_TUTORIAL;
    
    if (!tutorialConnString) {
      console.log('❌ DATABASE_URL_TUTORIAL not configured\n');
      evidence.errors.push('DATABASE_URL_TUTORIAL not configured');
      return;
    }

    dbClient = new Client({ connectionString: tutorialConnString });
    await dbClient.connect();
    console.log('✓ Connected to tutorial database\n');

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

    console.log('Querying block_learning_state...\n');

    const result = await dbClient.query(query, [
      userId,
      PROVEN_CONFIG.brand,
      PROVEN_CONFIG.navigationNodeId,
      PROVEN_CONFIG.subtopicId,
      PROVEN_CONFIG.blockId,
    ]);

    if (result.rows.length === 0) {
      console.log('❌ No block_learning_state record found\n');
      evidence.errors.push('Database record not found');
      evidence.step['5_database_verification'] = false;
      return;
    }

    const record = result.rows[0];
    evidence.databaseRecord = record;

    console.log('✓ Database record found:');
    console.log('─'.repeat(70));
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
    console.log('─'.repeat(70));
    console.log();

    // Validation
    console.log('Validating database record...\n');

    const validations = [];

    if (record.visit_count >= 1) {
      console.log('  ✓ Visit count >= 1');
      validations.push(true);
    } else {
      console.log(`  ❌ Visit count invalid: ${record.visit_count}`);
      evidence.errors.push(`Invalid visit count: ${record.visit_count}`);
      validations.push(false);
    }

    if (record.cumulative_active_time_sec >= PROVEN_CONFIG.activeTimeSec) {
      console.log(`  ✓ Cumulative time >= ${PROVEN_CONFIG.activeTimeSec}s`);
      validations.push(true);
    } else {
      console.log(`  ❌ Cumulative time invalid: ${record.cumulative_active_time_sec}s`);
      evidence.errors.push(`Invalid cumulative time: ${record.cumulative_active_time_sec}s`);
      validations.push(false);
    }

    if (record.block_version === PROVEN_CONFIG.blockVersion) {
      console.log(`  ✓ Block version matches: ${PROVEN_CONFIG.blockVersion}`);
      validations.push(true);
    } else {
      console.log(`  ❌ Block version mismatch: expected ${PROVEN_CONFIG.blockVersion}, got ${record.block_version}`);
      evidence.errors.push(`Block version mismatch`);
      validations.push(false);
    }

    console.log();

    if (validations.every(v => v)) {
      console.log('✓ All validations passed\n');
      evidence.step['5_database_verification'] = true;
    } else {
      console.log('❌ Some validations failed\n');
      evidence.step['5_database_verification'] = false;
      return;
    }

    // ========================================================================
    // FINAL RESULT
    // ========================================================================

    console.log('═'.repeat(70));
    console.log('GATE 4K - FINAL RESULT');
    console.log('═'.repeat(70) + '\n');

    const allStepsPassed = Object.values(evidence.step).every(v => v === true);

    if (allStepsPassed && evidence.errors.length === 0) {
      console.log('✅ GATE 4K - PASS\n');
      console.log('Verified chain:');
      console.log('  Authentication');
      console.log('      ↓');
      console.log('  People Database (user ID)');
      console.log('      ↓');
      console.log('  POST /api/tutorial/ils/block-visit');
      console.log('      ↓');
      console.log('  POST /api/tutorial/ils/block-active-time');
      console.log('      ↓');
      console.log('  LearningProgressService');
      console.log('      ↓');
      console.log('  BlockLearningStateRepository');
      console.log('      ↓');
      console.log('  PostgreSQL (block_learning_state)');
      console.log();
      console.log('Test data used:');
      console.log(`  navigationNodeId: ${PROVEN_CONFIG.navigationNodeId}`);
      console.log(`  subtopicId: ${PROVEN_CONFIG.subtopicId}`);
      console.log(`  blockId: ${PROVEN_CONFIG.blockId}`);
      console.log(`  blockVersion: ${PROVEN_CONFIG.blockVersion}`);
      console.log(`  activeTimeSec: ${PROVEN_CONFIG.activeTimeSec}`);
      console.log();
      console.log('═'.repeat(70));
      console.log('NEXT: Gate 4L - Authentication / Runtime');
      console.log('STATUS: NOT AUTHORIZED YET');
      console.log('═'.repeat(70));
      console.log();
      
      process.exit(0);
    } else {
      console.log('❌ GATE 4K - FAIL\n');
      console.log('Failed steps:');
      Object.entries(evidence.step).forEach(([step, passed]) => {
        if (!passed) console.log(`  - ${step}`);
      });
      console.log();
      
      if (evidence.errors.length > 0) {
        console.log('Errors:');
        evidence.errors.forEach(err => console.log(`  - ${err}`));
        console.log();
      }
      
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Gate 4K failed with error:');
    console.error(error);
    console.error();
    process.exit(1);
  } finally {
    if (dbClient) {
      await dbClient.end();
    }
  }
}

main();
