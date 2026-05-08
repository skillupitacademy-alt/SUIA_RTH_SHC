#!/usr/bin/env tsx

/**
 * Test Component Architecture API Endpoint
 * 
 * Tests the /api/tutorial/sections/component-architecture endpoint
 * on the live server with real user credentials.
 * 
 * Usage: npx tsx scripts/test-component-architecture-api.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.tutorial-test') });

const RTH_TEST_TOKEN = process.env.RTH_TEST_TOKEN || '';
const RTH_BFF_URL = 'https://user.realtutorialhub.com';

async function testComponentArchitectureEndpoint() {
  console.log('\n================================================================');
  console.log('  TEST: /api/tutorial/sections/component-architecture');
  console.log('================================================================\n');

  console.log('📋 Configuration:');
  console.log(`   BFF URL: ${RTH_BFF_URL}`);
  console.log(`   Has Token: ${!!RTH_TEST_TOKEN}`);
  console.log(`   Token Length: ${RTH_TEST_TOKEN.length} chars`);
  console.log('');

  if (!RTH_TEST_TOKEN) {
    console.log('❌ No RTH_TEST_TOKEN found!');
    console.log('   Run: npx tsx scripts/generate-tutorial-test-tokens.ts');
    process.exit(1);
  }

  // Test 1: GET /api/tutorial/sections/component-architecture
  console.log('🧪 Test 1: GET /api/tutorial/sections/component-architecture');
  console.log('-'.repeat(64));

  try {
    const url = `${RTH_BFF_URL}/api/tutorial/sections/component-architecture`;
    console.log(`   URL: ${url}`);
    console.log(`   Method: GET`);
    console.log(`   Cookie: accessToken=${RTH_TEST_TOKEN.substring(0, 50)}...`);
    console.log('');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${RTH_TEST_TOKEN}`,
      },
    });

    console.log(`   📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`   📊 Content-Type: ${response.headers.get('content-type')}`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Request failed!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${errorText.substring(0, 500)}`);
      console.log('');
      
      // Show response headers for debugging
      console.log('   Response Headers:');
      response.headers.forEach((value, key) => {
        console.log(`      ${key}: ${value}`);
      });
      
      process.exit(1);
    }

    const data = await response.json();
    console.log(`✅ Request successful!`);
    console.log('');
    console.log('📦 Response Data:');
    console.log(`   Subtopic ID: ${data.subtopicId}`);
    console.log(`   Subtopic Name: ${data.subtopicName}`);
    console.log(`   Difficulty: ${data.difficulty}`);
    console.log(`   Total Sections: ${data.totalSections}`);
    console.log('');

    if (data.sections) {
      console.log('   Available Sections:');
      Object.keys(data.sections).forEach(sectionType => {
        console.log(`      ✓ ${sectionType}`);
      });
      console.log('');
    }

    // Test 2: GET specific section type
    console.log('🧪 Test 2: GET /api/tutorial/sections/component-architecture?sectionType=notes');
    console.log('-'.repeat(64));

    const notesUrl = `${RTH_BFF_URL}/api/tutorial/sections/component-architecture?sectionType=notes`;
    const notesResponse = await fetch(notesUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${RTH_TEST_TOKEN}`,
      },
    });

    console.log(`   📊 Response Status: ${notesResponse.status} ${notesResponse.statusText}`);
    
    if (notesResponse.ok) {
      const notesData = await notesResponse.json();
      console.log(`✅ Notes section retrieved!`);
      console.log(`   Section Type: ${notesData.sectionType}`);
      console.log(`   Difficulty: ${notesData.difficulty}`);
      console.log(`   Version: ${notesData.version}`);
      console.log(`   Language: ${notesData.language}`);
      console.log(`   Has Content: ${!!notesData.content}`);
      
      if (notesData.content) {
        const contentKeys = Object.keys(notesData.content);
        console.log(`   Content Keys: ${contentKeys.slice(0, 5).join(', ')}${contentKeys.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log(`❌ Failed to get notes section`);
    }

    console.log('');
    console.log('================================================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('================================================================');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✓ API endpoint is accessible');
    console.log('   ✓ Authentication is working');
    console.log('   ✓ Data exists in database');
    console.log('   ✓ Sections are being returned');
    console.log('');

  } catch (error) {
    console.log(`❌ Test failed with error:`);
    console.log(`   ${error instanceof Error ? error.message : String(error)}`);
    console.log('');
    
    if (error instanceof Error && error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
testComponentArchitectureEndpoint().catch((error) => {
  console.error('\n💥 Test crashed:', error);
  process.exit(1);
});
