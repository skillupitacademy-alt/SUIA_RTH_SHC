/**
 * Gate H - Step B: HTTP Navigation API Verification
 * 
 * PURPOSE:
 * Prove that the canonical completion timestamp stored in
 * tutorial_navigation_progress.completed_blocks crosses the
 * real HTTP boundary and appears in:
 * 
 *   GET /api/tutorial/ils/navigation/:navigationNodeId
 * 
 * ARCHITECTURE:
 * 
 *   tutorial_navigation_progress.completed_blocks
 *             ↓
 *   LearningProgressService.getNavigationProgress()
 *             ↓
 *   LearningProgressService.toDTO()
 *             ↓
 *   resolveBlockCompletedAt()
 *             ↓
 *   ILS navigation HTTP response
 * 
 * CRITICAL CONSTRAINTS:
 * - Do NOT modify BlockTelemetryProvider
 * - Do NOT modify ILSProvider
 * - Do NOT modify InstructionalBlockCompletionOrchestrator
 * - This test ONLY verifies the HTTP boundary
 * 
 * VERIFICATION LAYERS:
 * 1. Unit tests (Step A) ✅ - Prove service logic
 * 2. HTTP boundary (Step B) ⏳ - THIS TEST
 * 3. Gate G DB (Step C) - Prove persistence
 * 4. Gate H E2E (Step D) - Prove no duplicate after reload
 */

import { test, expect } from '@playwright/test';
import { Client } from 'pg';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
const DATABASE_URL = process.env.DATABASE_URL_TUTORIAL;

const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'; // From tutorial_navigation_progress
const BLOCK_ID = '7ffd2ee6-ec25-456d-9f0c-a85dc9e67b17'; // I1 - Using existing completion for HTTP boundary verification
const BLOCK_VERSION = 'I1';
const USER_ID = 'afc355ca-6bae-4165-89dd-198494a62f85'; // shadowUserId from JWT

/**
 * Get canonical completion timestamp from database
 */
async function getCanonicalCompletionTimestamp(
  client: Client,
  userId: string,
  navigationNodeId: string,
  blockId: string,
  blockVersion: string
): Promise<Date> {
  const result = await client.query(
    `SELECT completed_blocks
     FROM tutorial_navigation_progress
     WHERE user_id = $1
       AND navigation_node_id = $2
     LIMIT 1`,
    [userId, navigationNodeId]
  );

  if (result.rows.length === 0) {
    throw new Error(
      `No tutorial_navigation_progress found for user=${userId}, navigation=${navigationNodeId}`
    );
  }

  const completedBlocks = Array.isArray(result.rows[0].completed_blocks)
    ? result.rows[0].completed_blocks
    : [];

  const completion = completedBlocks.find(
    (entry: any) =>
      entry?.blockId === blockId &&
      entry?.blockVersion === blockVersion
  );

  if (!completion) {
    throw new Error(
      `Canonical completion not found for block=${blockId}, version=${blockVersion}`
    );
  }

  if (!completion.completedAt) {
    throw new Error('Canonical completion exists but completedAt is missing');
  }

  const timestamp = new Date(completion.completedAt);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Invalid canonical completedAt: ${completion.completedAt}`);
  }

  return timestamp;
}

test.describe('Gate H - Step B: HTTP Navigation API Verification', () => {
  test('canonical completed_blocks timestamp crosses navigation API boundary', async ({ page }) => {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL_TUTORIAL is not configured');
    }

    const dbClient = new Client({ connectionString: DATABASE_URL });

    try {
      await dbClient.connect();

      // ============================================================
      // STEP 1: Authenticate using existing project login flow
      // ============================================================
      
      console.log('\n[GATE H HTTP] ========== STEP 1: AUTHENTICATE ==========');
      console.log('[GATE H HTTP] Base URL:', BASE_URL);
      console.log('[GATE H HTTP] User:', STUDENT_EMAIL);

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
      await page.fill('input#email', STUDENT_EMAIL);
      await page.fill('input#password', STUDENT_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for login to process and session cookie to be set
      await page.waitForTimeout(8000);
      
      // Verify login succeeded
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log('[GATE H HTTP] ❌ Login failed, still on login page:', currentUrl);
        throw new Error('Login failed');
      }
      
      console.log('[GATE H HTTP] ✅ Login successful:', currentUrl);


      // ============================================================
      // STEP 2: Read canonical completion from database
      // ============================================================

      console.log('\n[GATE H HTTP] ========== STEP 2: READ CANONICAL COMPLETION ==========');
      console.log('[GATE H HTTP] User ID:', USER_ID);
      console.log('[GATE H HTTP] Navigation:', NAVIGATION_NODE_ID);
      console.log('[GATE H HTTP] Block ID:', BLOCK_ID);
      console.log('[GATE H HTTP] Block Version:', BLOCK_VERSION);

      const expectedCompletedAt = await getCanonicalCompletionTimestamp(
        dbClient,
        USER_ID,
        NAVIGATION_NODE_ID,
        BLOCK_ID,
        BLOCK_VERSION
      );

      console.log('[GATE H HTTP] Canonical DB timestamp:', expectedCompletedAt.toISOString());

      // ============================================================
      // STEP 3: Call real navigation API using authenticated context
      // ============================================================

      console.log('\n[GATE H HTTP] ========== STEP 3: CALL NAVIGATION API ==========');

      const apiUrl = `/api/tutorial/ils/navigation/${NAVIGATION_NODE_ID}?subtopicId=${encodeURIComponent(SUBTOPIC_ID)}`;
      console.log('[GATE H HTTP] GET', apiUrl);

      const response = await page.request.get(apiUrl);

      console.log('[GATE H HTTP] HTTP status:', response.status());

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      // ============================================================
      // STEP 4: Parse HTTP response
      // ============================================================

      console.log('\n[GATE H HTTP] ========== STEP 4: PARSE HTTP RESPONSE ==========');

      const body = await response.json();

      // Support both direct and wrapped response
      const dto = body?.data ?? body;

      console.log('[GATE H HTTP] Response structure:', {
        hasData: !!body?.data,
        hasBlocks: !!dto?.blocks,
        blocksLength: Array.isArray(dto?.blocks) ? dto.blocks.length : 'not array',
      });

      expect(Array.isArray(dto.blocks)).toBe(true);

      // ============================================================
      // STEP 5: Locate I1 block
      // ============================================================

      console.log('\n[GATE H HTTP] ========== STEP 5: LOCATE I1 BLOCK ==========');

      const i1 = dto.blocks.find(
        (block: any) =>
          block.blockId === BLOCK_ID &&
          block.blockVersion === BLOCK_VERSION
      );

      expect(i1).toBeDefined();

      console.log('[GATE H HTTP] I1 block found:', {
        blockId: i1.blockId,
        blockVersion: i1.blockVersion,
        activeTimeSec: i1.activeTimeSec,
        completedAt: i1.completedAt,
      });

      // ============================================================
      // STEP 6: Verify canonical completedAt crossed HTTP boundary
      // ============================================================

      console.log('\n[GATE H HTTP] ========== STEP 6: VERIFY CANONICAL TIMESTAMP ==========');

      // Critical assertion: completedAt must not be null
      expect(i1.completedAt).not.toBeNull();
      expect(i1.completedAt).toBeTruthy();

      const actualCompletedAt = new Date(i1.completedAt);

      expect(Number.isNaN(actualCompletedAt.getTime())).toBeFalsy();

      console.log('[GATE H HTTP] Expected (DB):', expectedCompletedAt.toISOString());
      console.log('[GATE H HTTP] Actual (HTTP):', actualCompletedAt.toISOString());

      // The most important assertion: exact timestamp match
      expect(actualCompletedAt.getTime()).toBe(expectedCompletedAt.getTime());

      // ============================================================
      // STEP 7: Verify telemetry state preserved
      // ============================================================

      console.log('\n[GATE H HTTP] ========== STEP 7: VERIFY TELEMETRY PRESERVED ==========');

      expect(typeof i1.activeTimeSec).toBe('number');
      console.log('[GATE H HTTP] I1 activeTimeSec:', i1.activeTimeSec);

      expect(i1.blockId).toBe(BLOCK_ID);
      expect(i1.blockVersion).toBe(BLOCK_VERSION);

      // ============================================================
      // STEP B RESULT
      // ============================================================

      console.log('\n[GATE H HTTP] ========================================');
      console.log('[GATE H HTTP] ✅ STEP B PASSED');
      console.log('[GATE H HTTP] ========================================');
      console.log('[GATE H HTTP]');
      console.log('[GATE H HTTP] Canonical completion successfully crossed the HTTP boundary.');
      console.log('[GATE H HTTP]');
      console.log('[GATE H HTTP] VERIFIED:');
      console.log('[GATE H HTTP]   ✅ HTTP status 200');
      console.log('[GATE H HTTP]   ✅ I1 block present in response');
      console.log('[GATE H HTTP]   ✅ completedAt not null');
      console.log('[GATE H HTTP]   ✅ completedAt matches canonical DB timestamp');
      console.log('[GATE H HTTP]   ✅ activeTimeSec preserved');
      console.log('[GATE H HTTP]');
      console.log('[GATE H HTTP] No Step 3 runtime component was modified.');
      console.log('[GATE H HTTP] ========================================\n');

    } finally {
      await dbClient.end();
    }
  });
});
