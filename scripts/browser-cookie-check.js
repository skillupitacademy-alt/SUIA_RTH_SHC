/**
 * 🔍 BROWSER COOKIE DIAGNOSTIC
 * 
 * Paste this into browser DevTools console to check if cookies are being sent.
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Check the output
 */

(async function checkCookieFlow() {
  console.log('%c🔍 COOKIE FLOW DIAGNOSTIC', 'font-size: 16px; font-weight: bold; color: #4CAF50');
  console.log('Checking if cookies are being sent in API calls...\n');

  // Check if cookies exist
  const cookies = document.cookie;
  console.log('📋 Current cookies:', cookies || '(none)');
  
  const hasAccessToken = cookies.includes('accessToken=');
  console.log(`✓ Has accessToken cookie: ${hasAccessToken ? '✅ YES' : '❌ NO'}`);
  
  if (!hasAccessToken) {
    console.log('%c⚠️  No accessToken cookie found!', 'color: orange; font-weight: bold');
    console.log('You need to login first.');
    return;
  }

  console.log('\n📡 Testing API call WITH credentials...');
  
  try {
    // Test with credentials: 'include'
    const response = await fetch('/api/profile', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('%c✅ SUCCESS!', 'color: green; font-weight: bold');
      console.log('Cookies are being sent correctly.');
      
      const data = await response.json();
      console.log('User data:', data);
    } else if (response.status === 401 || response.status === 403) {
      console.log('%c❌ FAILED!', 'color: red; font-weight: bold');
      console.log('Cookie exists but API rejected it.');
      console.log('Possible causes:');
      console.log('1. Cookie expired');
      console.log('2. Cookie domain mismatch');
      console.log('3. Backend authentication issue');
      
      const text = await response.text();
      console.log('Response:', text);
    } else {
      console.log('%c⚠️  UNEXPECTED STATUS', 'color: orange; font-weight: bold');
      console.log(`Got ${response.status} instead of 200 or 401/403`);
    }
  } catch (error) {
    console.error('%c❌ ERROR', 'color: red; font-weight: bold');
    console.error(error);
  }

  console.log('\n📡 Testing API call WITHOUT credentials...');
  
  try {
    // Test without credentials (should fail)
    const response = await fetch('/api/profile', {
      credentials: 'omit', // Don't send cookies
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log('%c✅ CORRECT!', 'color: green; font-weight: bold');
      console.log('Backend properly rejects requests without cookies.');
    } else if (response.status === 200) {
      console.log('%c🚨 SECURITY ISSUE!', 'color: red; font-weight: bold; font-size: 14px');
      console.log('API works WITHOUT cookies - this is a security vulnerability!');
    } else {
      console.log(`Got status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('%c📊 DIAGNOSIS', 'font-size: 14px; font-weight: bold');
  console.log('='.repeat(60));
  
  if (hasAccessToken) {
    console.log('✅ Cookie exists in browser');
    console.log('✅ Backend requires authentication');
    console.log('\n👉 If you\'re experiencing redirect loops:');
    console.log('   Check that ALL fetch() calls have:');
    console.log('   credentials: \'include\'');
    console.log('\n📝 To verify, check Network tab:');
    console.log('   1. Open Network tab');
    console.log('   2. Make an API request');
    console.log('   3. Click on the request');
    console.log('   4. Check Request Headers');
    console.log('   5. Look for "Cookie" header');
    console.log('   6. Should contain: accessToken=...');
  } else {
    console.log('❌ No accessToken cookie');
    console.log('👉 Login first, then run this script again');
  }
})();
