/**
 * ILS Progress Inspector - Determine incomplete block for F/G/H certification
 * 
 * PURPOSE:
 * Query the current ILS progress state for the Java "whatisjava" tutorial
 * to identify which block (I1, D1, or C1) is incomplete and can be used
 * for the proper 168-second automatic completion threshold test.
 * 
 * This prevents running a 4-minute certification test against an already-completed block.
 */

import { test } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';

// Java whatisjava block IDs
const BLOCKS = {
  I1: { id: 'f8bb01a7-a6f1-496a-b9fa-f9b7c8dc82be', version: 'I1', type: 'introduction' },
  D1: { id: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749', version: 'D1', type: 'technical' },
  C1: { id: '5b6e3e0f-e1fa-4a7a-a1f5-4e8e3e0f0001', version: 'C1', type: 'challenge' },
};

const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const NAVIGATION_NODE_ID = 'whatisjava';

test('Inspect ILS progress state for whatisjava', async ({ page }) => {
  console.log('[ILS INSPECTOR] Starting progress state inspection...');
  
  // Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for the post-login redirect (SkillUp routes to /dashboard after login)
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  console.log('[ILS INSPECTOR] ✅ Login successful');
  
  // Capture ILS progress response
  let progressResponse: any = null;
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/tutorial/ils/navigation/whatisjava') && url.includes(`subtopicId=${SUBTOPIC_ID}`)) {
      try {
        const body = await response.json();
        progressResponse = body;
        console.log('[ILS INSPECTOR] ✅ Captured ILS progress response');
      } catch {
        // Ignore non-JSON
      }
    }
  });
  
  // Navigate to tutorial page to trigger ILS progress fetch
  await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded' }
  );
  
  // Wait for ILS response
  await page.waitForTimeout(3000);
  
  if (!progressResponse) {
    console.log('[ILS INSPECTOR] ❌ No ILS progress response captured');
    return;
  }
  
  const data = progressResponse.data;
  
  console.log('\n[ILS INSPECTOR] ========== PROGRESS STATE ==========');
  console.log('[ILS INSPECTOR] Navigation Node:', data.navigationNodeId);
  console.log('[ILS INSPECTOR] Status:', data.status);
  console.log('[ILS INSPECTOR] Progress:', `${data.progressPercentage}%`);
  console.log('[ILS INSPECTOR] Completed:', `${data.completedBlockCount}/${data.totalBlockCount}`);
  console.log('[ILS INSPECTOR] Visit Count:', data.visitCount);
  console.log('[ILS INSPECTOR] First Viewed:', data.firstViewedAt);
  console.log('[ILS INSPECTOR] Last Viewed:', data.lastViewedAt);
  console.log('[ILS INSPECTOR] Completed At:', data.completedAt);
  
  console.log('\n[ILS INSPECTOR] ========== BLOCK STATUS ==========');
  
  const completedBlockIds = new Set(data.completedBlocks || []);
  
  Object.entries(BLOCKS).forEach(([name, block]) => {
    const isComplete = completedBlockIds.has(block.id);
    const status = isComplete ? '✅ COMPLETE' : '⚪ INCOMPLETE';
    console.log(`[ILS INSPECTOR] ${name} (${block.type}): ${status}`);
    console.log(`[ILS INSPECTOR]   Block ID: ${block.id}`);
    console.log(`[ILS INSPECTOR]   Version: ${block.version}`);
  });
  
  console.log('\n[ILS INSPECTOR] ========== RECOMMENDATION ==========');
  
  const incompleteBlocks = Object.entries(BLOCKS)
    .filter(([_, block]) => !completedBlockIds.has(block.id))
    .map(([name]) => name);
  
  if (incompleteBlocks.length === 0) {
    console.log('[ILS INSPECTOR] ⚠️  ALL BLOCKS COMPLETE');
    console.log('[ILS INSPECTOR] F/G/H certification requires incomplete block state.');
    console.log('[ILS INSPECTOR] Options:');
    console.log('[ILS INSPECTOR]   1. Reset ILS progress for this user/tutorial');
    console.log('[ILS INSPECTOR]   2. Use a different tutorial');
    console.log('[ILS INSPECTOR]   3. Use a different test user');
  } else {
    console.log('[ILS INSPECTOR] ✅ INCOMPLETE BLOCKS AVAILABLE');
    console.log('[ILS INSPECTOR] Recommended certification targets:', incompleteBlocks.join(', '));
    console.log('[ILS INSPECTOR]');
    console.log('[ILS INSPECTOR] Update gate-fgh-automatic-completion-certification.spec.ts:');
    const firstIncomplete = incompleteBlocks[0];
    const block = BLOCKS[firstIncomplete as keyof typeof BLOCKS];
    console.log(`[ILS INSPECTOR]   const TARGET_BLOCK_ID = '${block.id}';`);
    console.log(`[ILS INSPECTOR]   const TARGET_BLOCK_VERSION = '${block.version}';`);
  }
  
  console.log('\n[ILS INSPECTOR] ========== RAW RESPONSE ==========');
  console.log(JSON.stringify(data, null, 2));
  console.log('[ILS INSPECTOR] ============================================\n');
});
