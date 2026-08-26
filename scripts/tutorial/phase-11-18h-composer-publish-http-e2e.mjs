/**
 * PHASE 11.18H — COMPOSER PUBLISH HTTP E2E TEST
 * 
 * Node.js HTTP-based E2E test for Sidebar Composer Publish flow
 * 
 * Tests the complete HTTP Publish flow:
 * 1. Admin authentication (localhost:3007)
 * 2. Load existing draft sidebar
 * 3. HTTP POST Publish request
 * 4. Capture [PHASE_11_18E] instrumentation logs
 * 5. Database verification
 * 
 * REQUIRES:
 * - Admin server running: pnpm --filter @quiz/skillhubcore-admin dev (port 3007)
 * - Phase 11.18E instrumented code deployed
 * - Existing draft sidebar for Java topic
 * 
 * Usage: node scripts/tutorial/phase-11-18h-composer-publish-http-e2e.mjs
 */

import fetch from 'node-fetch';
import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
neonConfig.webSocketConstructor = WebSocket;

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = 'http://localhost:3007';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

// Known Java hierarchy
const JAVA_HIERARCHY = {
  brandId: 'shared',
  domainId: '30000000-0000-0000-0000-000000000001',  // Full Stack Development
  subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e', // Backend Development
  topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',    // Java
  activeSubtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4', // What is Java?
};

const SIDEBAR_ID = '6fc39d5c-4b65-49c7-96c2-66dec92b1ab8';

// Database connections
const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

// ============================================================
// TEST TRACKING
// ============================================================

const testResults = {
  adminAuth: 'PENDING',
  draftLoad: 'PENDING',
  publishRequest: 'PENDING',
  hierarchySync: 'PENDING',
  databaseVerify: 'PENDING',
};

function markPass(gate) {
  testResults[gate] = 'PASS';
  console.log(`✅ ${gate}: PASS`);
}

function markFail(gate, reason) {
  testResults[gate] = `FAIL: ${reason}`;
  console.log(`❌ ${gate}: FAIL - ${reason}`);
}

function markBlocked(gate, reason) {
  testResults[gate] = `BLOCKED: ${reason}`;
  console.log(`🚫 ${gate}: BLOCKED - ${reason}`);
}

// ============================================================
// UTILITIES
// ============================================================

function extractCookies(response) {
  const cookies = [];
  
  if (typeof response.headers.raw === 'function') {
    const rawCookies = response.headers.raw()['set-cookie'] || [];
    for (const cookie of rawCookies) {
      const nameValue = cookie.split(';')[0];
      if (nameValue.startsWith('accessToken=') || nameValue.startsWith('refreshToken=')) {
        cookies.push(nameValue);
      }
    }
    return cookies;
  }
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const accessToken = setCookie.match(/accessToken=([^;]+)/);
    if (accessToken) {
      cookies.push(`accessToken=${accessToken[1]}`);
    }
    const refreshToken = setCookie.match(/refreshToken=([^;]+)/);
    if (refreshToken) {
      cookies.push(`refreshToken=${refreshToken[1]}`);
    }
  }
  
  return cookies;
}

function section(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

// ============================================================
// MAIN TEST
// ============================================================

async function main() {
  console.log('');
  console.log('PHASE 11.18H — COMPOSER PUBLISH HTTP E2E TEST');
  console.log('');
  console.log('Testing HTTP POST Publish flow against localhost:3007');
  console.log('');
  
  let cookies = [];
  
  try {
    // ========================================================
    // GATE 1: Admin Authentication
    // ========================================================
    
    section('GATE 1: Admin Authentication');
    
    console.log(`Authenticating as ${ADMIN_EMAIL}...`);
    
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    if (loginRes.status !== 200) {
      const error = await loginRes.text();
      markBlocked('adminAuth', `Login failed: ${loginRes.status} ${error}`);
      throw new Error(`Admin authentication failed: ${loginRes.status}`);
    }
    
    cookies = extractCookies(loginRes);
    
    if (cookies.length === 0) {
      markBlocked('adminAuth', 'No cookies received');
      throw new Error('No authentication cookies received');
    }
    
    const loginData = await loginRes.json();
    console.log(`Authenticated user: ${loginData.user?.email || 'unknown'}`);
    console.log(`Cookies: ${cookies.length}`);
    
    markPass('adminAuth');
    
    // ========================================================
    // GATE 2: Load Existing Draft
    // ========================================================
    
    section('GATE 2: Load Existing Draft Sidebar');
    
    console.log('Querying TutorialDB for draft sidebar...');
    
    const draftResult = await tutorialPool.query(
      `SELECT 
        id, brand_id, domain_id, subject_id, topic_id, 
        active_subtopic_id, status, version, tree, 
        source_format, source_content,
        published_at, created_at, updated_at
      FROM tutorial_sidebar_trees_v2
      WHERE id = $1
      LIMIT 1`,
      [SIDEBAR_ID]
    );
    
    if (draftResult.rows.length === 0) {
      markFail('draftLoad', 'Draft sidebar not found in database');
      throw new Error(`Draft sidebar ${SIDEBAR_ID} not found`);
    }
    
    const draft = draftResult.rows[0];
    
    console.log(`Draft found:`);
    console.log(`  id:         ${draft.id}`);
    console.log(`  brand_id:   ${draft.brand_id}`);
    console.log(`  topic_id:   ${draft.topic_id}`);
    console.log(`  status:     ${draft.status}`);
    console.log(`  version:    ${draft.version}`);
    console.log(`  published_at: ${draft.published_at || 'NULL'}`);
    
    if (draft.status !== 'draft') {
      markFail('draftLoad', `Expected status='draft', got '${draft.status}'`);
      throw new Error(`Sidebar is not in draft state: ${draft.status}`);
    }
    
    if (draft.published_at !== null) {
      markFail('draftLoad', 'published_at should be NULL for draft');
      throw new Error('Draft has published_at timestamp');
    }
    
    markPass('draftLoad');
    
    // ========================================================
    // GATE 3: HTTP POST Publish Request
    // ========================================================
    
    section('GATE 3: HTTP POST Publish Request');
    
    console.log('Constructing Publish payload...');
    
    const publishPayload = {
      brandId: draft.brand_id,
      domainId: draft.domain_id,
      subjectId: draft.subject_id,
      topicId: draft.topic_id,
      activeSubtopicId: draft.active_subtopic_id || undefined,
      tree: draft.tree,
      sourceFormat: draft.source_format,
      sourceContent: draft.source_content,
      status: 'published',
    };
    
    console.log('');
    console.log('POST /api/tutorial-left-sidebar');
    console.log('Content-Type: application/json');
    console.log(`Cookie: ${cookies.join('; ')}`);
    console.log('');
    console.log('Payload keys:', Object.keys(publishPayload));
    console.log('');
    
    console.log('Sending Publish request...');
    
    const publishRes = await fetch(`${BASE_URL}/api/tutorial-left-sidebar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; '),
      },
      body: JSON.stringify(publishPayload),
    });
    
    console.log('');
    console.log(`HTTP ${publishRes.status} ${publishRes.statusText}`);
    console.log('');
    
    const publishBody = await publishRes.text();
    
    if (publishRes.status !== 200) {
      console.log('Response body:');
      console.log(publishBody);
      console.log('');
      
      markFail('publishRequest', `HTTP ${publishRes.status}: ${publishBody.substring(0, 200)}`);
      
      console.log('');
      console.log('⚠️  Publish request failed');
      console.log('');
      console.log('CHECK ADMIN SERVER LOGS FOR:');
      console.log('  [PHASE_11_18E][SYNC-01] through [SYNC-13]');
      console.log('');
      console.log('Expected log sequence:');
      console.log('  SYNC-01: MainDB topic lookup');
      console.log('  SYNC-02: MainDB subject lookup');
      console.log('  SYNC-03: MainDB domain lookup');
      console.log('  SYNC-04: MainDB subtopics lookup');
      console.log('  SYNC-05: TutorialDB domain UPSERT');
      console.log('  SYNC-06: TutorialDB subject UPSERT');
      console.log('  SYNC-07: TutorialDB topic UPSERT');
      console.log('  SYNC-08: TutorialDB subtopic UPSERT');
      console.log('  SYNC-09: MainDB verification');
      console.log('  SYNC-10: TutorialDB verification');
      console.log('  SYNC-11: Transaction commit prepare');
      console.log('  SYNC-12: Sidebar UPSERT');
      console.log('  SYNC-13: Final success');
      console.log('');
      
      throw new Error(`Publish failed: HTTP ${publishRes.status}`);
    }
    
    let publishData;
    try {
      publishData = JSON.parse(publishBody);
    } catch {
      markFail('publishRequest', 'Invalid JSON response');
      throw new Error('Publish response is not valid JSON');
    }
    
    console.log('Publish response:');
    console.log(JSON.stringify(publishData, null, 2));
    console.log('');
    
    if (!publishData.success) {
      markFail('publishRequest', publishData.message || 'success=false');
      throw new Error(`Publish returned success=false: ${publishData.message}`);
    }
    
    markPass('publishRequest');
    
    // ========================================================
    // GATE 4: Hierarchy Sync Verification
    // ========================================================
    
    section('GATE 4: Hierarchy Sync Verification');
    
    console.log('Checking TutorialDB curriculum tables...');
    console.log('');
    
    // Check domain
    const domainResult = await tutorialPool.query(
      'SELECT id, name FROM tutorial_domains WHERE id = $1',
      [JAVA_HIERARCHY.domainId]
    );
    
    if (domainResult.rows.length === 0) {
      markFail('hierarchySync', 'Domain not synced to TutorialDB');
      throw new Error('Domain missing from tutorial_domains');
    }
    
    console.log(`✅ Domain synced: ${domainResult.rows[0].name}`);
    
    // Check subject
    const subjectResult = await tutorialPool.query(
      'SELECT id, name FROM tutorial_subjects WHERE id = $1',
      [JAVA_HIERARCHY.subjectId]
    );
    
    if (subjectResult.rows.length === 0) {
      markFail('hierarchySync', 'Subject not synced to TutorialDB');
      throw new Error('Subject missing from tutorial_subjects');
    }
    
    console.log(`✅ Subject synced: ${subjectResult.rows[0].name}`);
    
    // Check topic
    const topicResult = await tutorialPool.query(
      'SELECT id, name FROM tutorial_topics WHERE id = $1',
      [JAVA_HIERARCHY.topicId]
    );
    
    if (topicResult.rows.length === 0) {
      markFail('hierarchySync', 'Topic not synced to TutorialDB');
      throw new Error('Topic missing from tutorial_topics');
    }
    
    console.log(`✅ Topic synced: ${topicResult.rows[0].name}`);
    
    // Check subtopics
    const subtopicsResult = await tutorialPool.query(
      'SELECT id, name FROM tutorial_subtopics WHERE topic_id = $1',
      [JAVA_HIERARCHY.topicId]
    );
    
    if (subtopicsResult.rows.length === 0) {
      markFail('hierarchySync', 'No subtopics synced to TutorialDB');
      throw new Error('Subtopics missing from tutorial_subtopics');
    }
    
    console.log(`✅ Subtopics synced: ${subtopicsResult.rows.length} subtopic(s)`);
    
    for (const subtopic of subtopicsResult.rows) {
      console.log(`   - ${subtopic.name} (${subtopic.id})`);
    }
    
    markPass('hierarchySync');
    
    // ========================================================
    // GATE 5: Database State Verification
    // ========================================================
    
    section('GATE 5: Database State Verification');
    
    console.log('Verifying published sidebar state...');
    console.log('');
    
    const verifyResult = await tutorialPool.query(
      `SELECT 
        id, brand_id, topic_id, status, version, 
        published_at, updated_at
      FROM tutorial_sidebar_trees_v2
      WHERE id = $1
      LIMIT 1`,
      [SIDEBAR_ID]
    );
    
    if (verifyResult.rows.length === 0) {
      markFail('databaseVerify', 'Sidebar row disappeared');
      throw new Error('Sidebar not found after publish');
    }
    
    const published = verifyResult.rows[0];
    
    console.log('Published sidebar:');
    console.log(`  id:           ${published.id}`);
    console.log(`  brand_id:     ${published.brand_id}`);
    console.log(`  topic_id:     ${published.topic_id}`);
    console.log(`  status:       ${published.status}`);
    console.log(`  version:      ${published.version}`);
    console.log(`  published_at: ${published.published_at}`);
    console.log(`  updated_at:   ${published.updated_at}`);
    console.log('');
    
    const errors = [];
    
    if (published.status !== 'published') {
      errors.push(`status is '${published.status}', expected 'published'`);
    }
    
    if (published.version !== draft.version + 1) {
      errors.push(`version is ${published.version}, expected ${draft.version + 1}`);
    }
    
    if (published.published_at === null) {
      errors.push('published_at is NULL');
    }
    
    if (errors.length > 0) {
      markFail('databaseVerify', errors.join('; '));
      console.log('❌ Verification errors:');
      for (const error of errors) {
        console.log(`   - ${error}`);
      }
      throw new Error('Database state verification failed');
    }
    
    console.log('✅ status = published');
    console.log(`✅ version incremented (${draft.version} → ${published.version})`);
    console.log('✅ published_at timestamp set');
    
    markPass('databaseVerify');
    
    // ========================================================
    // SUCCESS
    // ========================================================
    
    section('PHASE 11.18H — SUCCESS');
    
    console.log('🟢 All gates passed');
    console.log('');
    console.log('VERIFIED:');
    console.log('  ✅ Admin authentication');
    console.log('  ✅ Draft sidebar load');
    console.log('  ✅ HTTP POST Publish (200 OK)');
    console.log('  ✅ MainDB → TutorialDB hierarchy sync');
    console.log('  ✅ Sidebar status transition (draft → published)');
    console.log('  ✅ Version increment');
    console.log('  ✅ published_at timestamp');
    console.log('');
    console.log('The Publish flow is working correctly.');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('🔴 TEST FAILED');
    console.error('');
    console.error(`Error: ${error.message}`);
    console.error('');
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exitCode = 1;
  } finally {
    await tutorialPool.end();
  }
  
  // ========================================================
  // FINAL REPORT
  // ========================================================
  
  console.log('');
  console.log('='.repeat(70));
  console.log('TEST RESULTS');
  console.log('='.repeat(70));
  console.log('');
  
  for (const [gate, result] of Object.entries(testResults)) {
    const emoji = result === 'PASS' ? '✅' : result.startsWith('BLOCKED') ? '🚫' : '❌';
    console.log(`${emoji} ${gate.padEnd(20)}: ${result}`);
  }
  
  console.log('');
  console.log('='.repeat(70));
  
  const allPassed = Object.values(testResults).every(r => r === 'PASS');
  
  if (allPassed) {
    console.log('🟢 PHASE 11.18H CERTIFIED');
    console.log('   HTTP Publish flow working correctly');
  } else {
    console.log('🔴 PHASE 11.18H FAILED');
    console.log('   Check admin server logs for [PHASE_11_18E] instrumentation');
  }
  
  console.log('='.repeat(70));
  console.log('');
}

main();
