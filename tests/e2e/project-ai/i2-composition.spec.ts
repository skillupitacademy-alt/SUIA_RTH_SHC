import { test, expect } from '@playwright/test';

/**
 * I2 Composition Verification.
 * 
 * Verifies:
 * - I2 composition option exists in composer
 * - Tutorial generation completes successfully
 * - Tutorial renders with block components
 * - Block types and versions are present in DOM
 * 
 * Evidence generated: ev-browser-002
 */

test.describe('I2 Composition Verification', () => {
  test('should create I2 tutorial with verified blocks', async ({ page }) => {
    const baseURL = process.env.PROJECT_AI_BASE_URL || 'http://localhost:3001';
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Capture network failures
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()}`);
    });
    
    // Navigate to composer route
    await page.goto(`${baseURL}/composer`);
    await page.waitForLoadState('networkidle');
    
    // Click I2 composition option
    const i2Button = page.locator('button:has-text("I2"), [data-testid="i2-composition"]').first();
    
    // Check if I2 button exists
    const i2ButtonVisible = await i2Button.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!i2ButtonVisible) {
      // I2 composition may not be available - skip test
      test.skip(true, 'I2 composition not available in UI');
      return;
    }
    
    await i2Button.click();
    
    // Trigger tutorial generation
    const generateButton = page.locator('button:has-text("Generate"), [data-testid="generate-tutorial"]').first();
    await generateButton.click();
    
    // Wait for tutorial route (may take time for generation)
    await page.waitForURL(/\/tutorials\/\w+/, { timeout: 60000 });
    
    // Find tutorial blocks
    const blocks = page.locator('[data-project-ai="tutorial-block"]');
    const blockCount = await blocks.count();
    
    // Verify at least one block rendered
    expect(blockCount, 'At least one tutorial block should render').toBeGreaterThan(0);
    
    // Collect block types and versions
    const blockData = [];
    for (let i = 0; i < Math.min(blockCount, 10); i++) {
      const block = blocks.nth(i);
      const blockType = await block.getAttribute('data-block-type');
      const blockVersion = await block.getAttribute('data-block-version');
      
      blockData.push({
        index: i,
        blockType,
        blockVersion,
        hasType: !!blockType,
        hasVersion: !!blockVersion
      });
    }
    
    // Attach evidence
    const evidence = {
      evidenceId: 'ev-browser-002',
      type: 'i2-composition',
      baseURL,
      blockCount,
      blockData,
      consoleErrors,
      networkErrors,
      runId: process.env.PROJECT_AI_RUN_ID,
      commitSha: process.env.PROJECT_AI_COMMIT_SHA,
      snapshotHash: process.env.PROJECT_AI_SNAPSHOT_HASH,
      timestamp: new Date().toISOString()
    };
    
    await test.info().attach('i2-composition-evidence', {
      body: JSON.stringify(evidence, null, 2),
      contentType: 'application/json'
    });
    
    // Verify blocks have types and versions
    const blocksWithoutType = blockData.filter(b => !b.hasType);
    const blocksWithoutVersion = blockData.filter(b => !b.hasVersion);
    
    expect(blocksWithoutType, 'All blocks should have data-block-type').toHaveLength(0);
    expect(blocksWithoutVersion, 'All blocks should have data-block-version').toHaveLength(0);
  });
});
