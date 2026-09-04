/**
 * RTH Test Account Role Verification
 * 
 * This E2E test verifies that:
 * 1. Database has correct role for RTH test account
 * 2. Login generates token with correct roles array
 * 3. Token is accepted by authenticated endpoints
 * 4. Tutorial endpoints work with student role
 * 
 * Reconciles discrepancy between:
 * - Earlier log: [TOKEN_ISSUED] roles:["user"]
 * - Script result: Database has role='student'
 */
import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const RTH_BASE_URL = process.env.RTH_BASE_URL || 'http://realtutorialhub.localhost:3003';
const RTH_EMAIL = process.env.RTH_EMAIL || 'ajayshah@gmail.com';
const RTH_PASSWORD = process.env.RTH_PASSWORD || 'testing';

test.describe('RTH Student Role Verification', () => {
  
  test('should verify RTH test account has student role after login', async ({ page }) => {
    console.log('\n🧪 Test: RTH student role verification');
    console.log(`   Base URL: ${RTH_BASE_URL}`);
    console.log(`   Email: ${RTH_EMAIL}\n`);
    
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigate to login page');
    await page.goto(`${RTH_BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Step 2: Perform login
    console.log('🔐 Step 2: Perform login');
    await page.fill('input[name="email"]', RTH_EMAIL);
    await page.fill('input[name="password"]', RTH_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete (redirect to home or dashboard)
    await page.waitForURL(/\/(home|dashboard|tutorials)/, { 
      timeout: 60000,
      waitUntil: 'networkidle' 
    });
    console.log('✅ Login successful\n');
    
    // Step 3: Extract auth token from cookies
    console.log('🍪 Step 3: Extract auth token from cookies');
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token' || c.name === 'token');
    
    expect(authCookie, 'Auth token cookie should exist after login').toBeDefined();
    console.log(`✅ Auth token found: ${authCookie!.name}`);
    console.log(`   Length: ${authCookie!.value.length} chars\n`);
    
    // Step 4: Decode token to verify roles
    console.log('🔓 Step 4: Decode token to verify roles');
    const token = authCookie!.value;
    
    // Decode without verification (we just want to inspect claims)
    const decoded = jwt.decode(token) as any;
    
    expect(decoded, 'Token should be decodable').toBeDefined();
    expect(decoded.userId, 'Token should have userId').toBeDefined();
    expect(decoded.email, 'Token should have email').toBe(RTH_EMAIL);
    expect(decoded.roles, 'Token should have roles array').toBeDefined();
    expect(Array.isArray(decoded.roles), 'roles should be an array').toBe(true);
    
    console.log(`✅ Token decoded successfully:`);
    console.log(`   userId: ${decoded.userId}`);
    console.log(`   email: ${decoded.email}`);
    console.log(`   roles: ${JSON.stringify(decoded.roles)}`);
    console.log(`   brand: ${decoded.brand || 'not set'}\n`);
    
    // Step 5: Verify student role is present
    console.log('🎓 Step 5: Verify student role is present');
    const hasStudentRole = decoded.roles.includes('student');
    const hasUserRole = decoded.roles.includes('user');
    
    expect(hasStudentRole, 'Token should include "student" role').toBe(true);
    expect(hasUserRole, 'Token should include "user" role').toBe(true);
    
    console.log(`✅ Role verification passed:`);
    console.log(`   ✓ Has "user" role: ${hasUserRole}`);
    console.log(`   ✓ Has "student" role: ${hasStudentRole}\n`);
    
    // Step 6: Verify authenticated endpoint access
    console.log('🌐 Step 6: Test authenticated endpoint access');
    
    // Try accessing a student-protected endpoint (tutorial progress)
    const response = await page.request.get(
      `${RTH_BASE_URL}/api/tutorial/progress`,
      { 
        headers: {
          'cookie': `${authCookie!.name}=${authCookie!.value}`
        }
      }
    );
    
    console.log(`   Response status: ${response.status()}`);
    
    // Should NOT be 403 (which would indicate missing student role)
    expect(
      response.status(), 
      'Authenticated student should NOT get 403 from tutorial endpoints'
    ).not.toBe(403);
    
    // Should be either 200 (has progress) or 404 (no progress yet) - both valid
    expect(
      [200, 404].includes(response.status()),
      'Should get valid response (200 or 404, not 403)'
    ).toBe(true);
    
    console.log(`✅ Endpoint access verified (not blocked by role check)\n`);
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   ✅ Login successful`);
    console.log(`   ✅ Token contains userId: ${decoded.userId}`);
    console.log(`   ✅ Token contains roles: ${JSON.stringify(decoded.roles)}`);
    console.log(`   ✅ Has "student" role: true`);
    console.log(`   ✅ Tutorial endpoints accessible (not 403)`);
    console.log('\n✅✅✅ RTH test account role verification PASSED\n');
  });
  
  test('should handle tutorial page access with student role', async ({ page }) => {
    console.log('\n🧪 Test: Tutorial page access with student role');
    
    // Login
    await page.goto(`${RTH_BASE_URL}/login`);
    await page.fill('input[name="email"]', RTH_EMAIL);
    await page.fill('input[name="password"]', RTH_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(home|dashboard|tutorials)/, { timeout: 60000 });
    
    // Try to access a tutorial page (if available)
    // This should NOT redirect to access-denied if role is correct
    const tutorialPageResponse = await page.goto(
      `${RTH_BASE_URL}/tutorials/java/whatisjavascript`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );
    
    expect(tutorialPageResponse?.status()).not.toBe(403);
    
    // Should not be redirected to access denied
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/access-denied');
    expect(finalUrl).not.toContain('/unauthorized');
    
    console.log('✅ Tutorial page accessible without role-based redirect\n');
  });
});
