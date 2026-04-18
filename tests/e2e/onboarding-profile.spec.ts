import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Onboarding → Profile Flow
 * 
 * Tests the critical user journey:
 * 1. Signup
 * 2. Login
 * 3. Complete Onboarding
 * 4. Access Profile
 * 
 * CRITICAL INVARIANT:
 * After onboarding completion, profile MUST be accessible
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3000';

test.describe('Onboarding → Profile E2E', () => {
  test('Complete flow: Signup → Login → Onboarding → Profile', async ({ page, request }) => {
    const timestamp = Date.now();
    const email = `e2e-onboarding-${timestamp}@test.com`;
    const password = 'Test@123456';
    const name = 'E2E Test User';

    // ================= STEP 1: SIGNUP =================
    console.log('1️⃣ SIGNUP...');
    const signupRes = await request.post(`${API_URL}/api/auth/signup`, {
      data: { email, password, name },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(signupRes.ok(), `Signup failed: ${signupRes.status()}`).toBeTruthy();
    console.log('   ✅ Signup successful');

    // ================= STEP 2: LOGIN =================
    console.log('2️⃣ LOGIN...');
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(loginRes.ok(), `Login failed: ${loginRes.status()}`).toBeTruthy();

    // Extract cookies from login response
    const setCookies = loginRes
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value);

    expect(setCookies.length).toBeGreaterThan(0);

    // Parse cookies for Playwright
    const cookies = setCookies.map((line) => {
      const parts = line.split(';').map((p) => p.trim());
      const [cookieName, value] = parts[0].split('=');
      const domain = parts.find((p) => p.toLowerCase().startsWith('domain='))?.split('=')[1] ?? 'localhost';
      const path = parts.find((p) => p.toLowerCase().startsWith('path='))?.split('=')[1] ?? '/';
      const secure = parts.some((p) => p.toLowerCase() === 'secure');
      const sameSitePart = parts.find((p) => p.toLowerCase().startsWith('samesite='))?.split('=')[1]?.toLowerCase();
      const sameSite: 'Strict' | 'Lax' | 'None' =
        sameSitePart === 'none' ? 'None' : sameSitePart === 'lax' ? 'Lax' : 'Strict';
      const httpOnly = parts.some((p) => p.toLowerCase() === 'httponly');
      const expiresPart = parts.find((p) => p.toLowerCase().startsWith('expires='));
      const expires = expiresPart
        ? Math.floor(new Date(expiresPart.split('=')[1]).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 3600;

      return { name: cookieName, value, domain, path, secure, sameSite, httpOnly, expires };
    });

    await page.context().addCookies(cookies);
    console.log('   ✅ Login successful, cookies set');

    // ================= STEP 3: ONBOARDING =================
    console.log('3️⃣ ONBOARDING...');
    
    // Navigate to onboarding page
    await page.goto(`${WEB_URL}/onboarding`);
    
    // Fill onboarding form (adjust selectors based on your actual form)
    // This is a placeholder - adjust based on your actual onboarding UI
    const onboardingData = {
      fullName: name,
      primaryGoal: 'job',
      domain: 'web',
      subDomain: 'frontend',
      experienceLevel: 'beginner',
      educationLevel: 'bachelors',
      status: 'student',
      skillLevel: 'beginner',
      timeCommitment: '5-10',
    };

    // Submit onboarding via API (more reliable than UI interaction)
    const onboardingRes = await request.post(`${WEB_URL}/api/onboarding`, {
      data: onboardingData,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });

    expect(onboardingRes.ok(), `Onboarding failed: ${onboardingRes.status()}`).toBeTruthy();
    console.log('   ✅ Onboarding completed');

    // ================= STEP 4: PROFILE ACCESS =================
    console.log('4️⃣ PROFILE ACCESS...');
    
    // Access profile via API
    const profileRes = await request.get(`${WEB_URL}/api/profile`, {
      headers: {
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });

    console.log('   Profile response status:', profileRes.status());
    
    // CRITICAL ASSERTION: Profile MUST be accessible after onboarding
    expect(profileRes.status()).toBe(200);
    
    const profileData = await profileRes.json();
    console.log('   Profile data:', JSON.stringify(profileData, null, 2));
    
    // Verify profile contains expected data
    expect(profileData).toBeTruthy();
    expect(profileData.name).toBe(name);
    expect(profileData.onboardingCompleted).toBe(true);
    
    console.log('   ✅ Profile accessible and valid');

    // ================= STEP 5: DATA INTEGRITY CHECK =================
    console.log('5️⃣ DATA INTEGRITY CHECK...');
    
    const integrityRes = await request.get(`${API_URL}/api/auth/debug/profile-integrity`, {
      headers: {
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });

    expect(integrityRes.ok()).toBeTruthy();
    
    const integrityData = await integrityRes.json();
    console.log('   Integrity check:', JSON.stringify(integrityData.integrity, null, 2));
    
    // CRITICAL ASSERTION: No data integrity violations
    expect(integrityData.integrity.valid).toBe(true);
    expect(integrityData.integrity.violation).toBeNull();
    expect(integrityData.user.isOnboarded).toBe(true);
    expect(integrityData.profile.exists).toBe(true);
    
    console.log('   ✅ Data integrity validated');
    console.log('');
    console.log('🎯 COMPLETE FLOW VERIFIED:');
    console.log('   ✅ Signup');
    console.log('   ✅ Login');
    console.log('   ✅ Onboarding');
    console.log('   ✅ Profile Access');
    console.log('   ✅ Data Integrity');
  });

  test('Profile returns 404 before onboarding', async ({ page, request }) => {
    const timestamp = Date.now();
    const email = `e2e-no-onboarding-${timestamp}@test.com`;
    const password = 'Test@123456';
    const name = 'No Onboarding User';

    // Signup
    const signupRes = await request.post(`${API_URL}/api/auth/signup`, {
      data: { email, password, name },
    });
    expect(signupRes.ok()).toBeTruthy();

    // Login
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email, password },
    });
    expect(loginRes.ok()).toBeTruthy();

    const setCookies = loginRes
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value);

    const cookies = setCookies.map((line) => {
      const parts = line.split(';').map((p) => p.trim());
      const [cookieName, value] = parts[0].split('=');
      return { name: cookieName, value, domain: 'localhost', path: '/', secure: false, sameSite: 'Lax' as const, httpOnly: true, expires: Math.floor(Date.now() / 1000) + 3600 };
    });

    // Try to access profile WITHOUT onboarding
    const profileRes = await request.get(`${WEB_URL}/api/profile`, {
      headers: {
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });

    // Should return 404 since profile doesn't exist yet
    expect(profileRes.status()).toBe(404);
    
    const errorData = await profileRes.json();
    expect(errorData.error).toBe('Profile not found');
    
    console.log('✅ Profile correctly returns 404 before onboarding');
  });
});
