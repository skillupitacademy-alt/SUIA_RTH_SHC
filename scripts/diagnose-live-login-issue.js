#!/usr/bin/env node

/**
 * 🔍 LIVE LOGIN ISSUE DIAGNOSTIC
 * 
 * Tests the exact flow: Login → Dashboard → Check what breaks
 */

const BASE_URL = 'https://user.realtutorialhub.com';
const EMAIL = 'ajayshah@gmail.com';
const PASSWORD = 'testing';

async function extractSetCookies(res) {
  const cookies = [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      cookies.push(value);
    }
  });
  return cookies;
}

function parseCookies(setCookieHeaders) {
  return setCookieHeaders
    .map(c => c.split(';')[0])
    .join('; ');
}

async function diagnose() {
  console.log('🔍 DIAGNOSING LIVE LOGIN ISSUE');
  console.log('='.repeat(80));
  console.log(`URL: ${BASE_URL}`);
  console.log(`User: ${EMAIL}`);
  console.log('='.repeat(80));

  // STEP 1: LOGIN
  console.log('\n1️⃣ ATTEMPTING LOGIN...');
  
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
  });

  console.log(`   Status: ${loginRes.status}`);

  if (!loginRes.ok) {
    console.log('   ❌ LOGIN FAILED');
    const text = await loginRes.text();
    console.log(`   Response: ${text}`);
    return;
  }

  const loginData = await loginRes.json();
  console.log('   ✅ LOGIN SUCCESS');
  console.log(`   User: ${loginData.user?.email || 'unknown'}`);
  console.log(`   Onboarding: ${loginData.user?.onboardingCompleted ? 'completed' : 'pending'}`);

  // Extract cookies
  const setCookies = await extractSetCookies(loginRes);
  console.log(`\n   🍪 Cookies Set: ${setCookies.length}`);
  setCookies.forEach((c, i) => {
    const parts = c.split(';');
    console.log(`      [${i + 1}] ${parts[0]}`);
    console.log(`          Domain: ${parts.find(p => p.includes('Domain=')) || 'not set'}`);
    console.log(`          SameSite: ${parts.find(p => p.includes('SameSite=')) || 'not set'}`);
    console.log(`          Secure: ${parts.find(p => p.includes('Secure')) ? 'yes' : 'no'}`);
  });

  const cookieHeader = parseCookies(setCookies);

  // STEP 2: CHECK AUTH/ME
  console.log('\n2️⃣ CHECKING AUTH STATE (/api/auth/me)...');
  
  const authRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  console.log(`   Status: ${authRes.status}`);

  if (authRes.status === 200) {
    const authData = await authRes.json();
    console.log('   ✅ AUTH OK');
    console.log(`   User ID: ${authData.userId || authData.id || 'unknown'}`);
    console.log(`   Roles: ${JSON.stringify(authData.roles || [])}`);
  } else {
    console.log('   ❌ AUTH FAILED');
    const text = await authRes.text();
    console.log(`   Response: ${text}`);
  }

  // STEP 3: CHECK PROFILE
  console.log('\n3️⃣ CHECKING PROFILE (/api/profile)...');
  
  const profileRes = await fetch(`${BASE_URL}/api/profile`, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  console.log(`   Status: ${profileRes.status}`);

  if (profileRes.status === 200) {
    const profileData = await profileRes.json();
    console.log('   ✅ PROFILE OK');
    console.log(`   User ID: ${profileData.userId || profileData.id || 'unknown'}`);
    console.log(`   Email: ${profileData.email || 'unknown'}`);
    console.log(`   Onboarding: ${profileData.onboardingCompleted ? 'completed' : 'pending'}`);
  } else {
    console.log('   ❌ PROFILE FAILED');
    const text = await profileRes.text();
    console.log(`   Response: ${text}`);
  }

  // STEP 4: CHECK DASHBOARD
  console.log('\n4️⃣ CHECKING DASHBOARD (/api/dashboard)...');
  
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  console.log(`   Status: ${dashRes.status}`);

  if (dashRes.status === 200) {
    console.log('   ✅ DASHBOARD OK');
  } else if (dashRes.status === 403) {
    console.log('   ⚠️  DASHBOARD FORBIDDEN (RBAC)');
    const text = await dashRes.text();
    console.log(`   Response: ${text}`);
  } else if (dashRes.status === 401) {
    console.log('   ❌ DASHBOARD UNAUTHORIZED');
    const text = await dashRes.text();
    console.log(`   Response: ${text}`);
  } else {
    console.log(`   ❌ DASHBOARD ERROR (${dashRes.status})`);
    const text = await dashRes.text();
    console.log(`   Response: ${text}`);
  }

  // STEP 5: SIMULATE BROWSER BEHAVIOR
  console.log('\n5️⃣ SIMULATING BROWSER DASHBOARD REQUEST (WITHOUT COOKIE)...');
  console.log('   This simulates what happens if browser doesn\'t send cookies');
  
  const browserDashRes = await fetch(`${BASE_URL}/api/dashboard`);
  
  console.log(`   Status: ${browserDashRes.status}`);
  
  if (browserDashRes.status === 401) {
    console.log('   ❌ UNAUTHORIZED - This is why you get redirected to login!');
  }

  // DIAGNOSIS
  console.log('\n' + '='.repeat(80));
  console.log('🧠 DIAGNOSIS');
  console.log('='.repeat(80));

  if (authRes.status === 200 && profileRes.status === 200) {
    console.log('\n✅ Backend is working correctly');
    console.log('   - Login sets cookies ✅');
    console.log('   - Auth/me works with cookies ✅');
    console.log('   - Profile works with cookies ✅');
    
    if (dashRes.status === 401) {
      console.log('\n❌ PROBLEM: Dashboard returns 401 even WITH cookies');
      console.log('   Root cause: Cookie not being sent or not being validated');
    } else if (dashRes.status === 403) {
      console.log('\n⚠️  Dashboard blocked by RBAC (expected if user lacks role)');
    }
    
    console.log('\n🔥 LIKELY ISSUE:');
    console.log('   Your BROWSER is not sending cookies with dashboard request');
    console.log('   Even though backend sets them correctly');
    console.log('\n   Possible causes:');
    console.log('   1. Dashboard page fetch() missing credentials: "include"');
    console.log('   2. Browser cookie policy blocking cross-origin cookies');
    console.log('   3. Cookie domain mismatch');
    console.log('   4. SameSite=Strict blocking cookies');
  } else {
    console.log('\n❌ Backend issue detected');
    if (authRes.status !== 200) {
      console.log('   - Auth/me failing');
    }
    if (profileRes.status !== 200) {
      console.log('   - Profile failing');
    }
  }

  console.log('\n' + '='.repeat(80));
}

diagnose().catch(console.error);
