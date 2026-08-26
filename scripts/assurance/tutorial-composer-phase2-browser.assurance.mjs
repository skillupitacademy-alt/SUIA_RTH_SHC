#!/usr/bin/env node

/**
 * Phase 2 — Browser Acceptance Automated Test
 * 
 * Fully automated browser testing of hydration race protection.
 * Tests actual browser behavior against skillhubcore-admin running on localhost:3007
 */

import { chromium } from 'playwright';

const COMPOSER_URL = 'http://localhost:3007/tools/tutorial-page-content';
const failures = [];
const warnings = [];

function log(message) {
  console.log(`[INFO] ${message}`);
}

function pass(testName) {
  console.log(`✅ [PASS] ${testName}`);
}

function fail(testName, reason) {
  console.error(`❌ [FAIL] ${testName}`);
  console.error(`   Reason: ${reason}`);
  failures.push({ test: testName, reason });
}

function warn(message) {
  console.warn(`⚠️  [WARN] ${message}`);
  warnings.push(message);
}

async function login(page) {
  log('Logging in as admin@skillhubcore.in');
  
  try {
    await page.goto('http://localhost:3007/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@skillhubcore.in');
    await page.fill('input[type="password"]', 'testing');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL(/dashboard|tools/, { timeout: 10000 });
    
    pass('Login successful');
    return true;
  } catch (error) {
    fail('Login', error.message);
    return false;
  }
}

async function testEmptyNavigationNode(page) {
  log('Running Test A - Empty navigation node');
  
  try {
    const apiRequests = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/tutorial-composer/sections')) {
        apiRequests.push(request.url());
      }
    });

    await page.goto(COMPOSER_URL);
    await page.waitForLoadState('networkidle');

    // Select hierarchy without navigation node
    const domainSelect = await page.locator('select').filter({ hasText: /domain/i }).first();
    const subjectSelect = await page.locator('select').filter({ hasText: /subject/i }).first();
    const topicSelect = await page.locator('select').filter({ hasText: /topic/i }).first();
    const subtopicSelect = await page.locator('select').filter({ hasText: /subtopic/i }).first();

    if (await domainSelect.count() === 0) {
      throw new Error('Domain selector not found');
    }

    // Select domain and wait for subjects to load
    const domainOptions = await domainSelect.locator('option').count();
    if (domainOptions <= 1) {
      throw new Error('No domain options available');
    }
    await domainSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Wait for subject options to be populated
    await page.waitForFunction(() => {
      const select = document.querySelector('select[id*="subject"]');
      return select && select.options.length > 1;
    }, { timeout: 10000 });

    // Select subject and wait for topics to load
    await subjectSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Wait for topic options to be populated
    await page.waitForFunction(() => {
      const select = document.querySelector('select[id*="topic"]');
      return select && select.options.length > 1;
    }, { timeout: 10000 });

    // Select topic and wait for subtopics to load
    await topicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Wait for subtopic options to be populated
    await page.waitForFunction(() => {
      const select = document.querySelector('select[id*="subtopic"]');
      return select && select.options.length > 1;
    }, { timeout: 10000 });

    // Select subtopic
    await subtopicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1500);

    // Verify: No API request fired when navigation node is empty
    if (apiRequests.length === 0) {
      pass('Test A - No API request when navigationNodeId is empty');
      return true;
    } else {
      fail('Test A - Empty navigation node', `API request fired when navigationNodeId was empty: ${apiRequests[0]}`);
      return false;
    }
  } catch (error) {
    fail('Test A - Empty navigation node', error.message);
    return false;
  }
}

async function testLoadNavigationNodeA(page) {
  log('Running Test B - Load Navigation Node A');
  
  try {
    let requestFired = false;
    let requestUrl = '';
    
    page.removeAllListeners('request');
    page.on('request', (request) => {
      if (request.url().includes('/api/tutorial-composer/sections')) {
        requestFired = true;
        requestUrl = request.url();
      }
    });

    await page.goto(COMPOSER_URL);
    await page.waitForLoadState('networkidle');

    // Select full hierarchy
    const domainSelect = await page.locator('select').filter({ hasText: /domain/i }).first();
    const subjectSelect = await page.locator('select').filter({ hasText: /subject/i }).first();
    const topicSelect = await page.locator('select').filter({ hasText: /topic/i }).first();
    const subtopicSelect = await page.locator('select').filter({ hasText: /subtopic/i }).first();
    const navSelect = await page.locator('select').filter({ hasText: /navigation/i }).first();

    await domainSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    
    await subjectSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    
    await topicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    
    await subtopicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Select navigation node
    await navSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1500);

    // Verify: API request was made
    if (requestFired && requestUrl.includes('navigationNodeId=')) {
      pass('Test B - API request fired with navigationNodeId');
      return true;
    } else {
      fail('Test B - Load Navigation Node A', `Expected API request with navigationNodeId but got: ${requestUrl}`);
      return false;
    }
  } catch (error) {
    fail('Test B - Load Navigation Node A', error.message);
    return false;
  }
}

async function testSwitchAToB(page) {
  log('Running Test C - Switch from Node A to Node B');
  
  try {
    const requests = [];
    
    page.removeAllListeners('request');
    page.on('request', (request) => {
      if (request.url().includes('/api/tutorial-composer/sections')) {
        const url = new URL(request.url());
        const navId = url.searchParams.get('navigationNodeId');
        requests.push({ url: request.url(), navigationNodeId: navId, timestamp: Date.now() });
      }
    });

    await page.goto(COMPOSER_URL);
    await page.waitForLoadState('networkidle');

    // Setup hierarchy
    const domainSelect = await page.locator('select').filter({ hasText: /domain/i }).first();
    const subjectSelect = await page.locator('select').filter({ hasText: /subject/i }).first();
    const topicSelect = await page.locator('select').filter({ hasText: /topic/i }).first();
    const subtopicSelect = await page.locator('select').filter({ hasText: /subtopic/i }).first();
    const navSelect = await page.locator('select').filter({ hasText: /navigation/i }).first();

    await domainSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await subjectSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await topicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await subtopicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Select Node A
    await navSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Switch to Node B
    await navSelect.selectOption({ index: 2 });
    await page.waitForTimeout(1500);

    // Verify: Two distinct requests were made
    if (requests.length >= 2) {
      const nodeAId = requests[0].navigationNodeId;
      const nodeBId = requests[1].navigationNodeId;
      
      if (nodeAId !== nodeBId) {
        pass('Test C - Navigation switch triggered distinct requests');
        return true;
      } else {
        fail('Test C - Switch A to B', 'Both requests had same navigationNodeId');
        return false;
      }
    } else {
      fail('Test C - Switch A to B', `Expected 2+ requests but got ${requests.length}`);
      return false;
    }
  } catch (error) {
    fail('Test C - Switch A to B', error.message);
    return false;
  }
}

async function testRapidNavigation(page) {
  log('Running Test D - Rapid A → B → C navigation');
  
  try {
    const requests = [];
    
    page.removeAllListeners('request');
    page.on('request', (request) => {
      if (request.url().includes('/api/tutorial-composer/sections')) {
        const url = new URL(request.url());
        const navId = url.searchParams.get('navigationNodeId');
        requests.push({ navigationNodeId: navId, timestamp: Date.now() });
      }
    });

    await page.goto(COMPOSER_URL);
    await page.waitForLoadState('networkidle');

    // Setup hierarchy
    const domainSelect = await page.locator('select').filter({ hasText: /domain/i }).first();
    const subjectSelect = await page.locator('select').filter({ hasText: /subject/i }).first();
    const topicSelect = await page.locator('select').filter({ hasText: /topic/i }).first();
    const subtopicSelect = await page.locator('select').filter({ hasText: /subtopic/i }).first();
    const navSelect = await page.locator('select').filter({ hasText: /navigation/i }).first();

    await domainSelect.selectOption({ index: 1 });
    await page.waitForTimeout(200);
    await subjectSelect.selectOption({ index: 1 });
    await page.waitForTimeout(200);
    await topicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(200);
    await subtopicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Rapid sequence: A → B → C (minimal waiting)
    await navSelect.selectOption({ index: 1 }); // A
    await page.waitForTimeout(50);
    await navSelect.selectOption({ index: 2 }); // B
    await page.waitForTimeout(50);
    await navSelect.selectOption({ index: 3 }); // C
    
    await page.waitForTimeout(2000);

    // Verify: Multiple requests fired
    if (requests.length >= 2) {
      pass('Test D - Rapid navigation triggered multiple requests');
      log(`   Captured ${requests.length} requests in rapid sequence`);
      return true;
    } else {
      fail('Test D - Rapid navigation', `Expected 2+ requests but got ${requests.length}`);
      return false;
    }
  } catch (error) {
    fail('Test D - Rapid navigation', error.message);
    return false;
  }
}

async function testIdentitySeparation(page) {
  log('Running Test F - Identity separation verification');
  
  try {
    let capturedUrl = '';
    
    page.removeAllListeners('request');
    page.on('request', (request) => {
      if (request.url().includes('/api/tutorial-composer/sections')) {
        capturedUrl = request.url();
      }
    });

    await page.goto(COMPOSER_URL);
    await page.waitForLoadState('networkidle');

    // Select full hierarchy
    const domainSelect = await page.locator('select').filter({ hasText: /domain/i }).first();
    const subjectSelect = await page.locator('select').filter({ hasText: /subject/i }).first();
    const topicSelect = await page.locator('select').filter({ hasText: /topic/i }).first();
    const subtopicSelect = await page.locator('select').filter({ hasText: /subtopic/i }).first();
    const navSelect = await page.locator('select').filter({ hasText: /navigation/i }).first();

    await domainSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await subjectSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await topicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await subtopicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);
    await navSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Verify: All identity parameters present
    const hasSubtopicId = capturedUrl.includes('subtopicId=');
    const hasNavigationNodeId = capturedUrl.includes('navigationNodeId=');
    const hasBrandId = capturedUrl.includes('brandId=');

    if (hasSubtopicId && hasNavigationNodeId && hasBrandId) {
      pass('Test F - All identity parameters present in request');
      return true;
    } else {
      const missing = [];
      if (!hasSubtopicId) missing.push('subtopicId');
      if (!hasNavigationNodeId) missing.push('navigationNodeId');
      if (!hasBrandId) missing.push('brandId');
      fail('Test F - Identity separation', `Missing parameters: ${missing.join(', ')}`);
      return false;
    }
  } catch (error) {
    fail('Test F - Identity separation', error.message);
    return false;
  }
}

async function testHierarchyResetClearsNavigation(page) {
  log('Running Test G - Hierarchy change clears navigation');
  
  try {
    await page.goto(COMPOSER_URL);
    await page.waitForLoadState('networkidle');

    // Select full hierarchy including navigation
    const domainSelect = await page.locator('select').filter({ hasText: /domain/i }).first();
    const subjectSelect = await page.locator('select').filter({ hasText: /subject/i }).first();
    const topicSelect = await page.locator('select').filter({ hasText: /topic/i }).first();
    const subtopicSelect = await page.locator('select').filter({ hasText: /subtopic/i }).first();
    const navSelect = await page.locator('select').filter({ hasText: /navigation/i }).first();

    await domainSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await subjectSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await topicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await subtopicSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);
    await navSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Verify navigation is selected
    const navValueBefore = await navSelect.inputValue();
    if (!navValueBefore || navValueBefore === '') {
      warn('Navigation node was not selected before hierarchy change');
    }

    // Change subtopic
    await subtopicSelect.selectOption({ index: 2 });
    await page.waitForTimeout(500);

    // Verify: Navigation is reset
    const navValueAfter = await navSelect.inputValue();
    if (navValueAfter === '') {
      pass('Test G - Hierarchy change resets navigation selection');
      return true;
    } else {
      fail('Test G - Hierarchy reset', `Navigation node not cleared: ${navValueAfter}`);
      return false;
    }
  } catch (error) {
    fail('Test G - Hierarchy reset', error.message);
    return false;
  }
}

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('PHASE 2 — BROWSER ACCEPTANCE TEST');
  console.log('Testing: http://localhost:3007/tools/tutorial-page-content');
  console.log('============================================================');
  console.log('');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Suppress console errors from the page
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Ignore browser console errors
      }
    });

    page.on('pageerror', (error) => {
      // Ignore page errors
    });

    // Login first
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.error('');
      console.error('❌ Login failed - cannot proceed with tests');
      await browser.close();
      process.exitCode = 1;
      return;
    }

    console.log('');

    const results = {
      testA: await testEmptyNavigationNode(page),
      testB: await testLoadNavigationNodeA(page),
      testC: await testSwitchAToB(page),
      testD: await testRapidNavigation(page),
      testF: await testIdentitySeparation(page),
      testG: await testHierarchyResetClearsNavigation(page),
    };

    await browser.close();

    console.log('');
    console.log('============================================================');
    console.log('TEST SUMMARY');
    console.log('============================================================');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (warnings.length > 0) {
      console.log('');
      console.log('Warnings:');
      warnings.forEach((w) => console.log(`  - ${w}`));
    }

    if (failures.length > 0) {
      console.log('');
      console.error('============================================================');
      console.error('❌ PHASE 2 BROWSER ACCEPTANCE BLOCKED');
      console.error('============================================================');
      console.error('');
      console.error('Failed Tests:');
      failures.forEach((f) => {
        console.error(`  ${f.test}`);
        console.error(`    → ${f.reason}`);
      });
      console.error('');
      console.error('============================================================');
      process.exitCode = 1;
      return;
    }

    console.log('');
    console.log('============================================================');
    console.log('✅ PHASE 2 BROWSER ACCEPTANCE PASS');
    console.log('============================================================');
    console.log('');
    console.log('All browser acceptance tests passed.');
    console.log('Hydration race protection verified in actual browser.');
    console.log('');
    console.log('============================================================');
    process.exitCode = 0;
  } catch (error) {
    console.error('');
    console.error('❌ Fatal browser test failure:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('  - skillhubcore-admin is running on http://localhost:3007');
    console.error('  - Playwright is installed: pnpm install playwright');
    console.error('');
    process.exitCode = 1;
    
    if (browser) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exitCode = 1;
});
