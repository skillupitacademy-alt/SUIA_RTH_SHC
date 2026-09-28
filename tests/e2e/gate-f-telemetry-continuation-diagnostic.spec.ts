/**
 * Gate F Telemetry Continuation Diagnostic
 * 
 * PURPOSE:
 * Diagnose why active-time delivery stops after ~88 seconds while test remains on page
 * 
 * OBSERVATION TARGET:
 * The F/G/H run showed:
 *   0-120s:  4 active-time POSTs, 88 seconds accumulated
 *   120-240s: 0 active-time POSTs, no additional accumulation
 * 
 * HYPOTHESES TO TEST:
 * A. D1 stopped being the active block
 * B. Browser visibility changed (hidden/backgrounded)
 * C. React lifecycle/remount occurred
 * D. Active-time delivery queue stuck
 * E. Test infrastructure interfering with page
 * 
 * EVIDENCE TO CAPTURE:
 * - document.visibilityState every 10s
 * - document.hasFocus() every 10s
 * - activeBlock ID every 10s
 * - D1 data-is-completed every 10s
 * - All visibilitychange events
 * - All blur/focus events
 * - All pagehide/pageshow events
 * - All active-time POSTs
 * - All completion POSTs
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';

test('Gate F: Telemetry continuation diagnostic', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  // Capture all relevant events
  const timeline: Array<{
    elapsed: number;
    event: string;
    details: any;
  }> = [];

  const startTime = Date.now();

  function logEvent(event: string, details: any = {}) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    timeline.push({ elapsed, event, details });
    console.log(`[${elapsed}s] ${event}`, details);
  }

  // Login FIRST (without route interception)
  logEvent('LOGIN_START', {});
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for session to be established
  await page.waitForTimeout(5000);
  
  // Verify we're not still on login page
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    logEvent('LOGIN_FAILED', { currentUrl });
    throw new Error('Still on login page after submit');
  }
  
  logEvent('LOGIN_COMPLETE', { currentUrl });

  // NOW set up route interception for telemetry monitoring
  // Capture active-time POSTs
  const activeTimeRequests: Array<{
    elapsed: number;
    activeTimeSec: number;
    eventId: string;
  }> = [];

  await page.route('**/api/tutorial/ils/block-active-time', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const postData = request.postDataJSON();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (postData.blockId === D1_BLOCK_ID) {
        activeTimeRequests.push({
          elapsed,
          activeTimeSec: postData.activeTimeSec,
          eventId: postData.eventId,
        });
        logEvent('ACTIVE_TIME_POST', {
          activeTimeSec: postData.activeTimeSec,
          eventId: postData.eventId,
        });
      }
    }
    await route.continue();
  });

  // Capture completion POSTs
  const completionRequests: Array<{ elapsed: number }> = [];

  await page.route('**/api/tutorial/ils/block-completion', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const postData = request.postDataJSON();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (postData.blockId === D1_BLOCK_ID) {
        completionRequests.push({ elapsed });
        logEvent('COMPLETION_POST', { blockId: postData.blockId });
      }
    }
    await route.continue();
  });

  // Capture visibility changes
  await page.exposeFunction('__logVisibilityChange', (state: string) => {
    logEvent('VISIBILITY_CHANGE', { state });
  });

  await page.exposeFunction('__logWindowBlur', () => {
    logEvent('WINDOW_BLUR', {});
  });

  await page.exposeFunction('__logWindowFocus', () => {
    logEvent('WINDOW_FOCUS', {});
  });

  // Navigate to D1 block
  logEvent('NAVIGATION_START', {});
  await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded', timeout: 30000 }
  );

  await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, { 
    state: 'visible',
    timeout: 10000 
  });

  await page.locator(`[data-block-id="${D1_BLOCK_ID}"]`).scrollIntoViewIfNeeded();
  logEvent('D1_BLOCK_VISIBLE', {});

  // Install browser-side event listeners
  await page.evaluate(() => {
    document.addEventListener('visibilitychange', () => {
      (window as any).__logVisibilityChange(document.visibilityState);
    });

    window.addEventListener('blur', () => {
      (window as any).__logWindowBlur();
    });

    window.addEventListener('focus', () => {
      (window as any).__logWindowFocus();
    });
  });

  logEvent('EVENT_LISTENERS_INSTALLED', {});

  // Wait for telemetry initialization
  await page.waitForTimeout(5000);
  logEvent('TELEMETRY_INIT_COMPLETE', {});

  // Observation loop: check state every 15 seconds for 3 minutes
  const observationDuration = 180000; // 3 minutes
  const observationInterval = 15000; // 15 seconds
  const observationStart = Date.now();

  while (Date.now() - observationStart < observationDuration) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    // Capture browser state
    const browserState = await page.evaluate(() => {
      return {
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
        url: window.location.href,
      };
    });

    // Capture D1 block state
    const d1State = await page.evaluate((blockId) => {
      const block = document.querySelector(`[data-block-id="${blockId}"]`);
      if (!block) {
        return { found: false };
      }

      return {
        found: true,
        isCompleted: block.getAttribute('data-is-completed'),
        isActive: block.getAttribute('data-is-active'),
        autoCompletionEnabled: block.getAttribute('data-auto-completion-enabled'),
        inViewport: block.getBoundingClientRect().top < window.innerHeight,
      };
    }, D1_BLOCK_ID);

    // Capture active block from ActiveBlockProvider
    const activeBlockState = await page.evaluate(() => {
      // Try to find active block marker in DOM
      const activeMarkers = document.querySelectorAll('[data-is-active="true"]');
      if (activeMarkers.length === 0) {
        return { activeBlockCount: 0 };
      }

      const activeBlockIds = Array.from(activeMarkers).map(el => 
        el.getAttribute('data-block-id')
      );

      return {
        activeBlockCount: activeMarkers.length,
        activeBlockIds,
      };
    });

    logEvent('STATE_OBSERVATION', {
      browser: browserState,
      d1Block: d1State,
      activeBlocks: activeBlockState,
      activeTimeRequestsCount: activeTimeRequests.length,
      lastActiveTimeSec: activeTimeRequests.length > 0 
        ? activeTimeRequests[activeTimeRequests.length - 1].activeTimeSec
        : null,
    });

    await page.waitForTimeout(observationInterval);
  }

  logEvent('OBSERVATION_COMPLETE', {});

  // Summary
  console.log('\n========== DIAGNOSTIC SUMMARY ==========\n');
  console.log(`Total active-time POSTs: ${activeTimeRequests.length}`);
  console.log(`Total completion POSTs: ${completionRequests.length}`);
  
  if (activeTimeRequests.length > 0) {
    console.log('\nActive-time delivery timeline:');
    activeTimeRequests.forEach((req, idx) => {
      console.log(`  [${idx + 1}] ${req.elapsed}s: ${req.activeTimeSec}s (eventId: ${req.eventId.substring(0, 8)}...)`);
    });

    const lastDelivery = activeTimeRequests[activeTimeRequests.length - 1];
    const timeSinceLastDelivery = Math.round((Date.now() - startTime) / 1000) - lastDelivery.elapsed;
    console.log(`\nTime since last delivery: ${timeSinceLastDelivery}s`);

    if (timeSinceLastDelivery > 60) {
      console.log('⚠️  WARNING: No delivery for >60s - telemetry may have stopped');
    }
  }

  console.log('\nVisibility/focus events:');
  const visibilityEvents = timeline.filter(t => 
    t.event.includes('VISIBILITY') || t.event.includes('BLUR') || t.event.includes('FOCUS')
  );
  
  if (visibilityEvents.length === 0) {
    console.log('  ✅ No visibility/focus changes detected');
  } else {
    visibilityEvents.forEach(e => {
      console.log(`  [${e.elapsed}s] ${e.event}`, e.details);
    });
  }

  console.log('\nState observations (every 15s):');
  const stateObservations = timeline.filter(t => t.event === 'STATE_OBSERVATION');
  stateObservations.forEach(obs => {
    const details = obs.details;
    console.log(`  [${obs.elapsed}s]:`);
    console.log(`    visibility: ${details.browser.visibilityState}`);
    console.log(`    focus: ${details.browser.hasFocus}`);
    console.log(`    D1 found: ${details.d1Block.found}`);
    if (details.d1Block.found) {
      console.log(`    D1 active: ${details.d1Block.isActive}`);
      console.log(`    D1 completed: ${details.d1Block.isCompleted}`);
      console.log(`    D1 in viewport: ${details.d1Block.inViewport}`);
    }
    console.log(`    active blocks: ${details.activeBlocks.activeBlockCount}`);
    console.log(`    total POSTs: ${details.activeTimeRequestsCount}`);
  });

  console.log('\n========================================\n');

  // Store full timeline
  await page.evaluate((timelineData) => {
    (window as any).__diagnosticTimeline = timelineData;
  }, timeline);
});
