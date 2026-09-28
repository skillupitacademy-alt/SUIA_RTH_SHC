/**
 * Quick diagnostic to verify NEXT_PUBLIC_ENABLE_AUTO_COMPLETION propagation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';

test('Check environment variable propagation', async ({ page }) => {
  // Login first
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15000 });
  await page.fill('input#email', STUDENT_EMAIL);
  await page.fill('input#password', STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  // Navigate to Java whatisjava page
  await page.goto(
    `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`,
    { waitUntil: 'domcontentloaded' }
  );
  
  // Wait for page to render
  await page.waitForTimeout(3000);
  
  // Check what the browser sees
  const envValue = await page.evaluate(() => {
    return (window as any).process?.env?.NEXT_PUBLIC_ENABLE_AUTO_COMPLETION 
      ?? process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETION
      ?? 'undefined';
  });
  
  console.log('[ENV CHECK] Browser sees NEXT_PUBLIC_ENABLE_AUTO_COMPLETION:', envValue);
  
  // Check DOM attribute
  const domAttribute = await page.getAttribute(
    '[data-auto-completion-enabled]',
    'data-auto-completion-enabled'
  );
  
  console.log('[ENV CHECK] DOM data-auto-completion-enabled:', domAttribute);
  
  // Check raw value attribute
  const rawValue = await page.getAttribute(
    '[data-auto-completion-enabled]',
    'data-auto-completion-env-value'
  );
  
  console.log('[ENV CHECK] DOM data-auto-completion-env-value:', rawValue);
});
