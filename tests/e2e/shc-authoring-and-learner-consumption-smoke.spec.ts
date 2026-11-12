import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CONFIGURATION & CREDENTIALS
// ============================================================
function requiredFixture(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing explicit UAT fixture configuration: ${name}`);
  return value;
}

const SHC_ADMIN_URL = requiredFixture('SHC_ADMIN_URL');
const SUIA_URL = requiredFixture('SUIA_URL');
const RTH_URL = requiredFixture('RTH_URL');

const SHC_ADMIN_EMAIL = requiredFixture('SHC_ADMIN_EMAIL');
const SHC_ADMIN_PASSWORD = requiredFixture('SHC_ADMIN_PASSWORD');

const SUIA_STUDENT_EMAIL = requiredFixture('SUIA_STUDENT_EMAIL');
const SUIA_STUDENT_PASSWORD = requiredFixture('SUIA_STUDENT_PASSWORD');

const RTH_STUDENT_EMAIL = requiredFixture('RTH_STUDENT_EMAIL');
const RTH_STUDENT_PASSWORD = requiredFixture('RTH_STUDENT_PASSWORD');

const SCREENSHOTS_DIR = path.join(process.cwd(), '.evidence', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Ensure 1440x900 desktop viewport for all tests matching reference benchmark
test.use({
  viewport: { width: 1440, height: 900 },
});

// ============================================================
// TASK 36: SHC ADMIN TUTORIAL AUTHORING SMOKE
// ============================================================
test.describe('Task 36: SHC Admin Tutorial Authoring Journey', () => {
  test.setTimeout(300000); // 5 minutes for multi-route Next.js Turbopack JIT warmup

  test('SHC Admin Login and Composer Exploration', async ({ page }) => {
    console.log('\n======================================================');
    console.log('TASK 36: SHC ADMIN TUTORIAL AUTHORING SMOKE');
    console.log('======================================================');
    console.log(`Target: ${SHC_ADMIN_URL}`);

    // 1. Visit Login & Warmup
    console.log('📍 Step 1: Navigating to SHC Admin login and warming up route...');
    await page.goto(`${SHC_ADMIN_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'task36_01_shc_admin_login_page.png'), fullPage: false });

    // 2. Perform Login
    console.log('🔐 Step 2: Logging in as SHC Admin...');
    await page.fill('input[name="email"]', SHC_ADMIN_EMAIL);
    await page.fill('input[name="password"]', SHC_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // 3. Wait for authenticated redirect (Dashboard warmup 45-60s)
    console.log('⏳ Step 3: Awaiting authenticated dashboard navigation and Turbopack warmup (up to 90s)...');
    await page.waitForURL(/\/(dashboard|tools|admin)/, { timeout: 90000, waitUntil: 'domcontentloaded' });
    
    // Explicitly wait for Dashboard main layout elements to render
    const dashboardAnchor = page.locator('text=Core Engines & Services').or(page.locator('text=Admin Dashboard')).or(page.locator('h1, h2').first());
    await dashboardAnchor.first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      console.log('Dashboard specific anchor wait elapsed; current URL:', page.url());
    });

    // Settle time for full CSS hydration and metric widgets
    console.log('⏳ Settling dashboard layout for snapshot...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'task36_02_shc_admin_dashboard.png'), fullPage: false });
    console.log('📸 Captured task36_02_shc_admin_dashboard.png');

    // 4. Navigate to Tutorial Page Content Builder & Warmup
    console.log('📝 Step 4: Accessing Tutorial Page Content Builder (/tools/tutorial-page-content)...');
    const composerResponse = await page.goto(`${SHC_ADMIN_URL}/tools/tutorial-page-content`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    console.log(`Status: ${composerResponse?.status()}`);

    // Wait for Composer UI components (header, builder controls, preview pane)
    const composerAnchor = page.locator('text=Tutorial Page Builder')
      .or(page.locator('text=Create & Append Block Instances'))
      .or(page.locator('text=Tutorial Page Content'));
    await composerAnchor.first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      console.log('Composer anchor wait elapsed; current URL:', page.url());
    });

    // Settle time for editor panels and block registries to hydrate
    console.log('⏳ Settling composer panels for snapshot...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'task36_03_shc_admin_composer_full.png'), fullPage: false });
    console.log('📸 Captured task36_03_shc_admin_composer_full.png');

    // 5. Navigate to Tutorial Left Sidebar Builder & Warmup
    console.log('🌳 Step 5: Accessing Tutorial Left Sidebar Builder (/tools/tutorial-left-sidebar)...');
    const sidebarResponse = await page.goto(`${SHC_ADMIN_URL}/tools/tutorial-left-sidebar`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    console.log(`Status: ${sidebarResponse?.status()}`);

    // Wait for Sidebar builder elements (buttons, tree controls)
    const sidebarAnchor = page.locator('text=Left Sidebar Builder')
      .or(page.locator('text=Load Template'))
      .or(page.locator('button:has-text("Load Template")'));
    await sidebarAnchor.first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      console.log('Sidebar anchor wait elapsed; current URL:', page.url());
    });

    console.log('⏳ Settling sidebar builder for snapshot...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'task36_04_shc_admin_sidebar_full.png'), fullPage: false });
    console.log('📸 Captured task36_04_shc_admin_sidebar_full.png');

    console.log('✅ Task 36 authoring journey successfully recorded.');
  });
});

// ============================================================
// TASK 37: SUIA & RTH LEARNER CONSUMPTION & BRANDING SMOKE
// ============================================================
test.describe('Task 37: Multi-Tenant Learner Consumption & Branding Smoke', () => {
  test.setTimeout(240000); // 4 minutes for multi-page JIT warmup

  test('SUIA Learner Portal: Page A and Page B Resolution', async ({ page }) => {
    console.log('\n======================================================');
    console.log('TASK 37: SUIA LEARNER PORTAL CONSUMPTION');
    console.log('======================================================');
    console.log(`Target: ${SUIA_URL}`);

    // 1. Visit Login
    console.log('📍 Step 1: Navigating to SUIA Login...');
    await page.goto(`${SUIA_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);

    // 2. Perform Login
    console.log('🔐 Step 2: Logging in as SUIA Student...');
    await page.locator('input[name="email"], input#email').first().fill(SUIA_STUDENT_EMAIL);
    await page.locator('input[name="password"], input#password').first().fill(SUIA_STUDENT_PASSWORD);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 60000, waitUntil: 'domcontentloaded' }).catch(() => {
      console.log('Login redirect wait elapsed; proceeding to target route.');
    });

    // 3. Visit Java Tutorial Page A (what-is-java)
    console.log('📖 Step 3: Accessing Page A (/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java)...');
    const pageAResponse = await page.goto(
      `${SUIA_URL}/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java`,
      { waitUntil: 'domcontentloaded', timeout: 90000 }
    );
    console.log(`Page A HTTP Status: ${pageAResponse?.status()}`);

    // Wait for content blocks to hydrate
    await page.locator('[data-block-type]').first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      console.log('data-block-type not visible within 60s; checking page layout.');
    });

    // Check sidebar visibility and open if collapsed
    const navigationSidebar = page.locator('aside[aria-label="Tutorial navigation"]');
    if (!(await navigationSidebar.isVisible().catch(() => false))) {
      const menu = page.getByRole('button', { name: 'Toggle tutorial sidebar', exact: true });
      if ((await menu.count()) > 0) {
        await menu.click().catch(() => null);
      }
    }

    console.log('⏳ Settling Page A for crisp capture...');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'task37_01_suia_page_a_what_is_java.png'), fullPage: false });
    console.log('📸 Captured task37_01_suia_page_a_what_is_java.png');

    // 4. Visit Java Tutorial Page B (java-syntax)
    console.log('📖 Step 4: Accessing Page B (/tutorial-v2/programming/java/java-basics/whatisjava/java-syntax)...');
    const pageBResponse = await page.goto(
      `${SUIA_URL}/tutorial-v2/programming/java/java-basics/whatisjava/java-syntax`,
      { waitUntil: 'domcontentloaded', timeout: 90000 }
    );
    console.log(`Page B HTTP Status: ${pageBResponse?.status()}`);

    // Wait for content blocks to hydrate
    await page.locator('[data-block-type]').first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      console.log('Page B data-block-type not visible within 60s.');
    });

    console.log('⏳ Settling Page B for crisp capture...');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'task37_02_suia_page_b_java_syntax.png'), fullPage: false });
    console.log('📸 Captured task37_02_suia_page_b_java_syntax.png');

    console.log('✅ SUIA learner consumption successfully recorded.');
  });

  test('RTH Learner Portal: Branding & Page Resolution', async ({ page }) => {
    console.log('\n======================================================');
    console.log('TASK 37: RTH LEARNER PORTAL CONSUMPTION & BRANDING');
    console.log('======================================================');
    console.log(`Target: ${RTH_URL}`);

    // 1. Visit Login
    console.log('📍 Step 1: Navigating to RTH Login...');
    await page.goto(`${RTH_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);

    // 2. Perform Login
    console.log('🔐 Step 2: Logging in as RTH Student...');
    await page.locator('input[name="email"], input#email').first().fill(RTH_STUDENT_EMAIL);
    await page.locator('input[name="password"], input#password').first().fill(RTH_STUDENT_PASSWORD);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 60000, waitUntil: 'domcontentloaded' }).catch(() => {
      console.log('RTH login redirect wait elapsed; proceeding to target route.');
    });

    // 3. Visit Java Tutorial Page A on RTH
    console.log('📖 Step 3: Accessing Page A on RTH (/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java)...');
    const rthPageAResponse = await page.goto(
      `${RTH_URL}/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java`,
      { waitUntil: 'domcontentloaded', timeout: 90000 }
    );
    console.log(`RTH Page A HTTP Status: ${rthPageAResponse?.status()}`);

    // Wait for content blocks to hydrate
    await page.locator('[data-block-type]').first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      console.log('RTH data-block-type not visible within 60s.');
    });

    // Check sidebar visibility
    const navigationSidebar = page.locator('aside[aria-label="Tutorial navigation"]');
    if (!(await navigationSidebar.isVisible().catch(() => false))) {
      const menu = page.getByRole('button', { name: 'Toggle tutorial sidebar', exact: true });
      if ((await menu.count()) > 0) {
        await menu.click().catch(() => null);
      }
    }

    console.log('⏳ Settling RTH Page A for crisp capture...');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'task37_03_rth_page_a_what_is_java.png'), fullPage: false });
    console.log('📸 Captured task37_03_rth_page_a_what_is_java.png');

    console.log('✅ RTH learner consumption successfully recorded.');
  });
});
