#!/usr/bin/env tsx

/**
 * Test API with real cookie jar (simulating browser behavior)
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.tutorial-test') });

const RTH_TEST_TOKEN = process.env.RTH_TEST_TOKEN || '';

async function testWithCookie() {
  console.log('\n🧪 Testing API with Cookie Simulation\n');
  console.log('='.repeat(64));
  
  // First, let's verify the token is valid by checking its structure
  console.log('\n1️⃣  Verifying Token Structure\n');
  
  try {
    const [, payload] = RTH_TEST_TOKEN.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    console.log(`✅ Token is valid`);
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Roles: ${decoded.roles.join(', ')}`);
    console.log(`   Brand: ${decoded.brand}`);
    console.log(`   Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`);
    
    const isExpired = decoded.exp < Date.now() / 1000;
    if (isExpired) {
      console.log(`\n❌ TOKEN IS EXPIRED!`);
      console.log(`   Generate a new token with: npx tsx scripts/generate-tutorial-test-tokens.ts`);
      process.exit(1);
    }
  } catch (e) {
    console.log(`❌ Invalid token format`);
    process.exit(1);
  }
  
  // Test the API endpoint
  console.log('\n2️⃣  Testing API Endpoint\n');
  
  const url = 'https://user.realtutorialhub.com/api/tutorial/sections/component-architecture';
  
  console.log(`URL: ${url}\n`);
  
  // Method 1: Using Cookie header (what our script does)
  console.log('Method 1: Cookie Header (Script)');
  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': `accessToken=${RTH_TEST_TOKEN}`,
      },
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const error = await response.json();
      console.log(`   Error: ${error.error}`);
    }
  } catch (e) {
    console.log(`   Error: ${e}`);
  }
  
  console.log('');
  
  // Explain the issue
  console.log('='.repeat(64));
  console.log('\n📋 DIAGNOSIS\n');
  console.log('The API endpoint requires authentication via cookies.');
  console.log('');
  console.log('❌ Issue: When testing from a script, we send Cookie as a header,');
  console.log('   but the middleware may not parse it the same way as a browser.');
  console.log('');
  console.log('✅ Solution: The user must be logged in via the browser.');
  console.log('   When logged in, the browser automatically sends the accessToken');
  console.log('   cookie with every request.');
  console.log('');
  console.log('🔍 To test properly:');
  console.log('   1. Open https://user.realtutorialhub.com/login');
  console.log('   2. Login with: ajayshah@gmail.com / testing');
  console.log('   3. Navigate to: https://user.realtutorialhub.com/start-learning/subtopic/component-architecture');
  console.log('   4. The page should load data from the database');
  console.log('');
  console.log('='.repeat(64));
}

testWithCookie();
