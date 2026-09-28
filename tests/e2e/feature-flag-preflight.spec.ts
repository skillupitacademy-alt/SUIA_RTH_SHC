/**
 * Feature Flag Preflight - Verify NEXT_PUBLIC_ENABLE_AUTO_COMPLETION
 * 
 * PURPOSE:
 * Quick verification that the automatic completion feature flag is properly
 * enabled in the browser before running the full 3-4 minute F/G/H certification.
 * 
 * This prevents wasting time on a 210-second test run only to discover the
 * feature flag evaluated to false/undefined.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';

test('Auto-completion feature flag preflight', async ({ page }) => {
  console.log('[FLAG PREFLIGHT] Starting feature flag verification...');
  
  // Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  
  await page.waitForSelector('input#email', {
    state: 'visible',
    timeout: 15000,
  });
  
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  
  await page.click('button[type="submit"]');
  
  // Wait for the post-login redirect (SkillUp routes to /dashboard after login)
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  console.log('[FLAG PREFLIGHT] ✅ Login successful');
  
  // Navigate to tutorial page
  await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded' }
  );
  console.log('[FLAG PREFLIGHT] ✅ Tutorial page loaded');
  
  // Wait for page to render
  await page.waitForTimeout(2000);
  
  // Check for the observability container with feature flag attributes
  const container = page.locator('[data-auto-completion-enabled]');
  await container.waitFor({ state: 'attached', timeout: 5000 });
  
  const enabled = await container.getAttribute('data-auto-completion-enabled');
  const envValue = await container.getAttribute('data-auto-completion-env-value');
  
  console.log('[FLAG PREFLIGHT] Feature flag state:');
  console.log('[FLAG PREFLIGHT]   data-auto-completion-enabled:', enabled);
  console.log('[FLAG PREFLIGHT]   data-auto-completion-env-value:', envValue);
  
  // Verify both attributes show "true"
  if (enabled !== 'true') {
    console.log('[FLAG PREFLIGHT] ❌ FAIL: Automatic completion is DISABLED');
    console.log('[FLAG PREFLIGHT] Expected: "true"');
    console.log('[FLAG PREFLIGHT] Received:', enabled);
    console.log('[FLAG PREFLIGHT]');
    console.log('[FLAG PREFLIGHT] This means NEXT_PUBLIC_ENABLE_AUTO_COMPLETION did not propagate to browser.');
    console.log('[FLAG PREFLIGHT] Gates F/G/H cannot proceed until feature flag is properly enabled.');
  }
  
  expect(enabled).toBe('true');
  expect(envValue).toBe('true');
  
  console.log('[FLAG PREFLIGHT] ✅ PASSED: Feature flag properly enabled');
  console.log('[FLAG PREFLIGHT] Ready to proceed with Gates F/G/H certification');
});
