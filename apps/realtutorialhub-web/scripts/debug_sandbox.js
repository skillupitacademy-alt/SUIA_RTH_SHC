const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\RealTutorialHub\\.gemini\\antigravity\\brain\\d76a9880-0587-462d-95a4-adbaacbd77ab';

async function runDebug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));

  console.log('Navigating to page...');
  await page.goto('http://localhost:3003/exam-design-sandbox.html', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'debug_v3_11_initial.png') });
  
  // Try to click Legend & Navigator
  console.log('Clicking Legend & Navigator...');
  const legendBtn = await page.$('#legendBtn');
  if (legendBtn) {
     await legendBtn.click();
     await page.waitForTimeout(500);
     
     // Check Popover visibility explicitly
     const popover = await page.$('#popover');
     const isVisible = await popover.isVisible();
     const className = await popover.getAttribute('class');
     const boundingBox = await popover.boundingBox();
     console.log('Popover visible to Playwright?', isVisible);
     console.log('Popover classes:', className);
     console.log('Popover bounding box:', boundingBox);
  } else {
     console.log('Legend Button NOT FOUND!');
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'debug_v3_11_after_legend_click.png') });

  // Try to click Save & Next
  console.log('Clicking Save & Next...');
  const nextBtn = await page.$('.btn-primary');
  if (nextBtn) {
     const nextText = await nextBtn.innerText();
     console.log('Found next button text:', nextText);
     await nextBtn.click();
     await page.waitForTimeout(500);
  } else {
     console.log('Save & Next Button NOT FOUND!');
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'debug_v3_11_after_next_click.png') });

  await browser.close();
}

runDebug().catch(console.error);
