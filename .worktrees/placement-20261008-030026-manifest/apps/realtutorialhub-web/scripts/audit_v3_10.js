import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\RealTutorialHub\\.gemini\\antigravity\\brain\\d76a9880-0587-462d-95a4-adbaacbd77ab';

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Dark Blue Elite Check (1920px)
  let page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3003/exam-design-sandbox.html');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_v3_10_dark_blue_dots.png') });
  
  // 2. Functional Popover Check
  // Click Legend & Navigator button
  await page.evaluate(() => document.querySelector('footer .action-node:nth-child(1) .btn-ghost:nth-child(2)').click());
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_v3_10_popover_functional.png') });

  // 3. Code Zenith (Large Code Check)
  // Navigate to Question 2
  await page.evaluate(() => document.querySelector('footer .action-node:nth-child(2) .btn-white:nth-child(1)').click());
  await page.waitForTimeout(500);
  // Ensure popover is closed
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_v3_10_code_is_king.png') });
  
  await page.close();

  // 4. Mobile Normalcy (320px)
  page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  await page.goto('http://localhost:3003/exam-design-sandbox.html');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_v3_10_mobile_elite.png') });
  await page.close();

  await browser.close();
}

runAudit().catch(console.error);
