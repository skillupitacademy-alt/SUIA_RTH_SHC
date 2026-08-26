/**
 * PHASE 11.18H — COMPOSER PUBLISH HTTP E2E TEST
 * 
 * Tests HTTP Publish flow with full Java navigation tree
 * 
 * REQUIRES:
 * - api-server: localhost:3000
 * - skillhubcore-admin: localhost:3007  
 * - skillup-web: localhost:3009
 * - api-gateway: localhost:8787
 * 
 * Usage: node scripts/tutorial/phase-11-18h-publish-http-e2e.mjs
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:3007';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

const JAVA_HIERARCHY = {
  brandId: 'shared',
  domainId: '30000000-0000-0000-0000-000000000001',
  subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e',
  topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',
  activeSubtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',
};

// Load Java navigation JSON
const navigationPath = path.join(__dirname, 'phase-11-18h-java-navigation.json');
const navigationTree = JSON.parse(fs.readFileSync(navigationPath, 'utf-8'));

console.log('');
console.log('═'.repeat(70));
console.log('PHASE 11.18H — COMPOSER PUBLISH HTTP E2E TEST');
console.log('═'.repeat(70));
console.log('');
console.log('Testing HTTP Publish flow with full Java navigation tree');
console.log('');
console.log(`Navigation nodes: ${countNodes(navigationTree.topics)}`);
console.log('');

function countNodes(nodes) {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}

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
    if (accessToken) cookies.push(`accessToken=${accessToken[1]}`);
    const refreshToken = setCookie.match(/refreshToken=([^;]+)/);
    if (refreshToken) cookies.push(`refreshToken=${refreshToken[1]}`);
  }
  return cookies;
}

async function main() {
  try {
    // Step 1: Admin Authentication
    console.log('─'.repeat(70));
    console.log('STEP 1: Admin Authentication');
    console.log('─'.repeat(70));
    console.log('');
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
      console.error(`❌ Login failed: ${loginRes.status}`);
      const error = await loginRes.text();
      console.error(error);
      process.exit(1);
    }
    
    const cookies = extractCookies(loginRes);
    if (cookies.length === 0) {
      console.error('❌ No authentication cookies received');
      process.exit(1);
    }
    
    const loginData = await loginRes.json();
    console.log(`✅ Authenticated: ${loginData.user?.email || 'unknown'}`);
    console.log(`✅ Cookies: ${cookies.length}`);
    console.log('');
    
    // Step 2: Send Publish Request
    console.log('─'.repeat(70));
    console.log('STEP 2: HTTP POST Publish Request');
    console.log('─'.repeat(70));
    console.log('');
    console.log('Constructing Publish payload...');
    
    const publishPayload = {
      brandId: JAVA_HIERARCHY.brandId,
      domainId: JAVA_HIERARCHY.domainId,
      subjectId: JAVA_HIERARCHY.subjectId,
      topicId: JAVA_HIERARCHY.topicId,
      activeSubtopicId: JAVA_HIERARCHY.activeSubtopicId,
      tree: navigationTree,
      sourceFormat: 'json',
      sourceContent: JSON.stringify(navigationTree, null, 2),
      status: 'published',
    };
    
    console.log('');
    console.log('Payload structure:');
    console.log(`  brandId: ${publishPayload.brandId}`);
    console.log(`  domainId: ${publishPayload.domainId}`);
    console.log(`  subjectId: ${publishPayload.subjectId}`);
    console.log(`  topicId: ${publishPayload.topicId}`);
    console.log(`  activeSubtopicId: ${publishPayload.activeSubtopicId}`);
    console.log(`  tree.topics.length: ${publishPayload.tree.topics.length}`);
    console.log(`  total nodes: ${countNodes(publishPayload.tree.topics)}`);
    console.log(`  sourceFormat: ${publishPayload.sourceFormat}`);
    console.log(`  status: ${publishPayload.status}`);
    console.log('');
    
    console.log('Sending POST /api/tutorial-left-sidebar...');
    console.log('');
    
    const startTime = Date.now();
    
    const publishRes = await fetch(`${BASE_URL}/api/tutorial-left-sidebar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; '),
      },
      body: JSON.stringify(publishPayload),
    });
    
    const elapsed = Date.now() - startTime;
    
    console.log(`HTTP ${publishRes.status} ${publishRes.statusText} (${elapsed}ms)`);
    console.log('');
    
    const responseBody = await publishRes.text();
    
    if (publishRes.status !== 200) {
      console.error('❌ PUBLISH FAILED');
      console.error('');
      console.error('Response:');
      console.error(responseBody);
      console.error('');
      console.error('═'.repeat(70));
      console.error('CHECK ADMIN SERVER LOGS FOR:');
      console.error('═'.repeat(70));
      console.error('');
      console.error('[PHASE_11_18E] instrumentation logs:');
      console.error('  [SYNC-01] MainDB topic lookup');
      console.error('  [SYNC-02] MainDB subject lookup');
      console.error('  [SYNC-03] MainDB domain lookup');
      console.error('  [SYNC-04] MainDB subtopics lookup');
      console.error('  [SYNC-05] TutorialDB domain UPSERT');
      console.error('  [SYNC-06] TutorialDB subject UPSERT');
      console.error('  [SYNC-07] TutorialDB topic UPSERT');
      console.error('  [SYNC-08] TutorialDB subtopic UPSERT');
      console.error('  [SYNC-09] MainDB verification');
      console.error('  [SYNC-10] TutorialDB verification');
      console.error('  [SYNC-11] Transaction commit prepare');
      console.error('  [SYNC-12] Sidebar UPSERT');
      console.error('  [SYNC-13] Final success');
      console.error('');
      console.error('Look for the FIRST failed SYNC step to identify root cause.');
      console.error('');
      process.exit(1);
    }
    
    let publishData;
    try {
      publishData = JSON.parse(responseBody);
    } catch {
      console.error('❌ Invalid JSON response');
      console.error(responseBody);
      process.exit(1);
    }
    
    console.log('✅ PUBLISH SUCCESS');
    console.log('');
    console.log('Response:');
    console.log(JSON.stringify(publishData, null, 2));
    console.log('');
    
    if (publishData.success) {
      console.log('═'.repeat(70));
      console.log('🟢 PHASE 11.18H — SUCCESS');
      console.log('═'.repeat(70));
      console.log('');
      console.log('HTTP Publish flow completed successfully!');
      console.log('');
      console.log('VERIFIED:');
      console.log('  ✅ Admin authentication');
      console.log('  ✅ HTTP POST /api/tutorial-left-sidebar');
      console.log('  ✅ Payload with ' + countNodes(navigationTree.topics) + ' navigation nodes');
      console.log('  ✅ Response HTTP 200');
      console.log('  ✅ Response success=true');
      console.log('');
      console.log('The Composer Publish flow is working correctly.');
      console.log('Check admin server logs for [PHASE_11_18E] instrumentation.');
      console.log('');
    } else {
      console.error('❌ Response returned success=false');
      console.error(publishData.message || 'No error message');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('');
    console.error('═'.repeat(70));
    console.error('🔴 TEST FAILED');
    console.error('═'.repeat(70));
    console.error('');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    process.exit(1);
  }
}

main();
