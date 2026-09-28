/**
 * DIAGNOSTIC: Verify DOM Ref Fix for Block Identity Attributes
 * 
 * This test verifies that data-ils-block-id and data-ils-block-version
 * attributes now appear on the same element as data-auto-completion-enabled
 * after moving the containerRef from inner div to outer div.
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://skillup.localhost:3009';
const STUDENT_EMAIL = 'student@skillupitacademy.com';
const STUDENT_PASSWORD = 'testing';
const JAVA_D1_PATH = '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava';
const EXPECTED_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

async function loginAsLearner(page: Page) {
  // Capture ALL browser console logs from the start
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('[BROWSER ERROR]:', error.message);
  });
  
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.waitForTimeout(1000);
  
  await Promise.all([
    page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  
  await page.waitForTimeout(1500);
  console.log('[DIAGNOSTIC] Logged in successfully');
}

test.describe('Diagnostic: Block Identity DOM Ref Fix', () => {
  test('[suia] should have ILS block identity attributes on auto-completion container', async ({ page }) => {
    // Login
    await loginAsLearner(page);
    
    // Navigate to Java D1 block
    const fullURL = `${BASE_URL}${JAVA_D1_PATH}`;
    await page.goto(fullURL);
    await page.waitForLoadState('domcontentloaded');
    
    console.log('[DIAGNOSTIC] Page loaded, waiting for auto-completion container...');
    
    // Wait for auto-completion container
    const container = page.locator('[data-auto-completion-enabled]');
    await expect(container).toBeVisible({ timeout: 10000 });
    
    console.log('[DIAGNOSTIC] Container found, checking attributes...');
    
    // Verify environment flag
    const enabledAttr = await container.getAttribute('data-auto-completion-enabled');
    console.log('[DIAGNOSTIC] data-auto-completion-enabled:', enabledAttr);
    expect(enabledAttr).toBe('true');
    
    // Scroll D1 block into view to activate it
    console.log('[DIAGNOSTIC] Scrolling D1 block into view...');
    const d1Block = page.locator(`[data-block-id="${EXPECTED_BLOCK_ID}"]`);
    await d1Block.scrollIntoViewIfNeeded();
    
    // Wait for ActiveBlockProvider IntersectionObserver + ILS state update
    console.log('[DIAGNOSTIC] Waiting for ILS to detect active block...');
    await page.waitForTimeout(5000); // Increased to 5s to ensure ILS has time to fetch and update
    
    // NOW CHECK: Do ILS block identity attributes appear on the SAME container element?
    console.log('[DIAGNOSTIC] Checking for ILS block identity attributes...');
    
    // Poll for block identity attributes (max 30 seconds)
    let blockId: string | null = null;
    let blockVersion: string | null = null;
    
    for (let i = 0; i < 60; i++) {
      blockId = await container.getAttribute('data-ils-block-id');
      blockVersion = await container.getAttribute('data-ils-block-version');
      
      if (blockId && blockVersion) {
        console.log(`[DIAGNOSTIC] ✅ Block identity found after ${i * 0.5}s:`, { blockId, blockVersion });
        break;
      }
      
      if (i % 10 === 0 && i > 0) {
        console.log(`[DIAGNOSTIC] Still waiting for block identity... (${i * 0.5}s elapsed)`);
      }
      
      await page.waitForTimeout(500);
    }
    
    // Verify results
    console.log('[DIAGNOSTIC] Final attributes:', {
      blockId,
      blockVersion,
      expectedBlockId: EXPECTED_BLOCK_ID,
      match: blockId === EXPECTED_BLOCK_ID,
    });
    
    // CRITICAL ASSERTION: After DOM ref fix, these attributes MUST exist
    expect(blockId).toBe(EXPECTED_BLOCK_ID);
    expect(blockVersion).toBe('D1');
    
    // Also verify activeTimeSec attribute exists (should be 0 initially)
    const activeTimeSec = await container.getAttribute('data-ils-active-time-sec');
    console.log('[DIAGNOSTIC] data-ils-active-time-sec:', activeTimeSec);
    expect(activeTimeSec).toBeTruthy(); // Should be '0' or higher
    
    console.log('[DIAGNOSTIC] ✅ DOM REF FIX VERIFIED - All ILS attributes present on auto-completion container');
  });
});
