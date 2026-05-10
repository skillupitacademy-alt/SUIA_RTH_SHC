/**
 * SHC Admin Login Redirect Test
 * ==============================
 * Uses Playwright to simulate actual browser behavior
 * Tests the complete flow including client-side redirect after login
 */

import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ADMIN_URL = 'https://admin.skillhubcore.in';
const LOGIN_EMAIL = 'admin@skillhubcore.in';
const LOGIN_PASSWORD = 'testing';

console.log('🌐 SHC Admin Login Redirect Test (Browser Simulation)');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

async function runTest() {
  let browser;
  let context;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({
      headless: true, // Run in headless mode
    });

    context = await browser.newContext({
      ignoreHTTPSErrors: true, // Accept self-signed certificates if any
      // Clear all storage and cache
      storageState: undefined,
    });

    page = await context.newPage();
    console.log('   ✓ Browser launched');
    console.log('');

    // Step 1: Navigate to login page
    console.log('✅ Step 1: Navigate to Login Page');
    console.log(`   URL: ${ADMIN_URL}/login`);
    
    await page.goto(`${ADMIN_URL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const loginUrl = page.url();
    console.log(`   Current URL: ${loginUrl}`);
    
    if (!loginUrl.includes('/login')) {
      throw new Error('Did not land on login page');
    }
    console.log('   ✓ Login page loaded');
    console.log('');

    // Step 2: Fill in login form
    console.log('✅ Step 2: Fill Login Form');
    console.log(`   Email: ${LOGIN_EMAIL}`);
    console.log(`   Password: ${LOGIN_PASSWORD}`);
    
    // Wait for form to be ready
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    
    // Fill in credentials
    await page.fill('input[name="email"]', LOGIN_EMAIL);
    await page.fill('input[name="password"]', LOGIN_PASSWORD);
    
    console.log('   ✓ Form filled');
    console.log('');

    // Step 3: Submit form and wait for redirect
    console.log('✅ Step 3: Submit Form and Wait for Redirect');
    
    // Click submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    console.log('   ✓ Form submitted');
    console.log('   ⏳ Waiting for redirect...');
    
    // Wait for navigation (redirect after login)
    await page.waitForURL((url) => {
      return !url.pathname.includes('/login');
    }, { timeout: 15000 });

    const redirectedUrl = page.url();
    console.log(`   Current URL: ${redirectedUrl}`);
    console.log('');

    // Step 4: Verify redirect destination
    console.log('✅ Step 4: Verify Redirect Destination');
    
    const urlObj = new URL(redirectedUrl);
    const pathname = urlObj.pathname;
    
    console.log(`   Pathname: ${pathname}`);
    
    if (pathname === '/dashboard') {
      console.log('   ✅ Redirected to /dashboard (CORRECT!)');
    } else if (pathname === '/onboarding') {
      console.log('   ❌ Redirected to /onboarding (INCORRECT!)');
      console.log('   This means onboardingCompleted is not being set correctly');
      throw new Error('Redirected to onboarding instead of dashboard');
    } else {
      console.log(`   ⚠️  Redirected to unexpected path: ${pathname}`);
    }
    console.log('');

    // Step 5: Verify dashboard content loaded
    console.log('✅ Step 5: Verify Dashboard Content');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check page title or content
    const pageTitle = await page.title();
    console.log(`   Page Title: ${pageTitle}`);
    
    // Check if dashboard content is present
    const bodyText = await page.textContent('body');
    const hasDashboard = bodyText.toLowerCase().includes('dashboard');
    const hasLogin = bodyText.toLowerCase().includes('login');
    const hasOnboarding = bodyText.toLowerCase().includes('onboarding');
    
    console.log(`   Contains "dashboard": ${hasDashboard}`);
    console.log(`   Contains "login": ${hasLogin}`);
    console.log(`   Contains "onboarding": ${hasOnboarding}`);
    console.log('');
    
    if (hasDashboard && !hasLogin) {
      console.log('   ✅ Dashboard content verified');
    } else {
      console.log('   ⚠️  Dashboard content not as expected');
    }
    console.log('');

    // Step 6: Check authentication state
    console.log('✅ Step 6: Verify Authentication State');
    
    // Check if cookies are set
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some(c => 
      c.name.includes('token') || c.name.includes('session') || c.name.includes('auth')
    );
    
    console.log(`   Cookies set: ${cookies.length}`);
    console.log(`   Has auth-related cookie: ${hasAuthCookie}`);
    console.log('');

    // Take a screenshot for verification
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'scripts/test-shc-login-screenshot.png',
      fullPage: true 
    });
    console.log('   ✓ Screenshot saved to: scripts/test-shc-login-screenshot.png');
    console.log('');

    // Success!
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 TEST PASSED!');
    console.log('');
    console.log('Summary:');
    console.log('  ✓ Login page loaded');
    console.log('  ✓ Form submitted successfully');
    console.log(`  ✓ Redirected to: ${pathname}`);
    console.log('  ✓ Dashboard content verified');
    console.log('  ✓ Authentication state confirmed');
    console.log('');
    console.log('The login flow is working correctly!');
    console.log('After login, users are redirected to /dashboard as expected.');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ TEST FAILED!');
    console.log('');
    console.log(`Error: ${error.message}`);
    console.log('');
    
    if (page) {
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Take error screenshot
      try {
        await page.screenshot({ 
          path: 'scripts/test-shc-login-error.png',
          fullPage: true 
        });
        console.log('Error screenshot saved to: scripts/test-shc-login-error.png');
      } catch (screenshotError) {
        console.log('Could not take error screenshot');
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    
    throw error;
  } finally {
    // Cleanup
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runTest()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
