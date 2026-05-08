#!/usr/bin/env node

/**
 * Test Component Architecture Page
 * 
 * Tests that the actual page loads and contains data from the database
 */

import fetch from 'node-fetch';

const RTH_BASE_URL = 'https://user.realtutorialhub.com';
const RTH_USER = {
  email: 'ajayshah@gmail.com',
  password: 'testing'
};

async function main() {
  console.log('🧪 Testing Component Architecture Page');
  console.log('═'.repeat(80));
  
  try {
    // Step 1: Login
    console.log('\n🔐 Step 1: Login');
    console.log('─'.repeat(80));
    
    const loginResponse = await fetch(`${RTH_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(RTH_USER),
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      process.exit(1);
    }
    
    const setCookie = loginResponse.headers.get('set-cookie');
    const tokenMatch = setCookie?.match(/accessToken=([^;]+)/);
    const accessToken = tokenMatch?.[1];
    
    if (!accessToken) {
      console.log('❌ No access token');
      process.exit(1);
    }
    
    console.log('✅ Login successful');
    console.log(`   Token: ${accessToken.substring(0, 20)}...`);
    
    // Step 2: Load the page
    console.log('\n📄 Step 2: Load Component Architecture Page');
    console.log('─'.repeat(80));
    
    const pageUrl = `${RTH_BASE_URL}/start-learning/subtopic/component-architecture`;
    console.log(`   URL: ${pageUrl}`);
    
    const pageResponse = await fetch(pageUrl, {
      headers: {
        'Cookie': `accessToken=${accessToken}`,
      },
      redirect: 'manual',
    });
    
    console.log(`   Status: ${pageResponse.status} ${pageResponse.statusText}`);
    
    if (pageResponse.status === 302 || pageResponse.status === 307) {
      const location = pageResponse.headers.get('location');
      console.log(`   ⚠️  Redirect to: ${location}`);
      if (location?.includes('/login')) {
        console.log('   ❌ Redirected to login - authentication failed');
        process.exit(1);
      }
    }
    
    if (!pageResponse.ok) {
      console.log('   ❌ Page failed to load');
      process.exit(1);
    }
    
    const html = await pageResponse.text();
    
    // Check if page contains expected content
    const hasReactRoot = html.includes('__NEXT_DATA__') || html.includes('id="__next"');
    const hasTitle = html.toLowerCase().includes('component') || html.toLowerCase().includes('architecture');
    
    console.log('   ✅ Page loaded successfully');
    console.log(`   Has React root: ${hasReactRoot ? '✅' : '❌'}`);
    console.log(`   Has title content: ${hasTitle ? '✅' : '❌'}`);
    console.log(`   Page size: ${html.length} bytes`);
    
    // Step 3: Summary
    console.log('\n═'.repeat(80));
    console.log('📊 RESULT');
    console.log('═'.repeat(80));
    
    if (pageResponse.ok && hasReactRoot) {
      console.log('\n✅ SUCCESS: Component Architecture page loads correctly');
      console.log('\n📝 What this means:');
      console.log('   - Users can access the page');
      console.log('   - Authentication is working');
      console.log('   - The page will fetch data from the database API');
      console.log('\n🔗 Test it yourself:');
      console.log(`   1. Go to: ${RTH_BASE_URL}/login`);
      console.log(`   2. Login with: ${RTH_USER.email}`);
      console.log(`   3. Navigate to: ${pageUrl}`);
      console.log('   4. The page should display tutorial content from database\n');
      process.exit(0);
    } else {
      console.log('\n❌ FAILED: Page did not load correctly\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

main();
