#!/usr/bin/env node

/**
 * Tutorial Composer API Integration Test
 * 
 * Tests the NEW Tutorial Composer API endpoints:
 * - POST   /api/tutorial-composer/sections
 * - GET    /api/tutorial-composer/sections
 * - GET    /api/tutorial-composer/sections/:id
 * - PATCH  /api/tutorial-composer/sections/:id
 * - POST   /api/tutorial-composer/sections/:id/publish
 * - DELETE /api/tutorial-composer/sections/:id
 * 
 * REQUIRES:
 * - Admin credentials
 * - SkillHubCore Admin running (localhost:3007 or deployed)
 * - Valid database connection
 */

import fetch from 'node-fetch';

// Configuration
const BASE_URL = process.env.SHC_ADMIN_URL || 'http://localhost:3007';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Test state
let adminToken = null;
let createdSectionId = null;
let testSubtopicId = null;

/**
 * Sample TutorialDocument for testing
 */
const SAMPLE_DOCUMENT = {
  schemaVersion: 1,
  metadata: {
    title: 'Test Tutorial Section',
    description: 'Integration test document',
    author: 'Test Suite',
    tags: ['test', 'integration'],
    estimatedDuration: 15,
    difficulty: 'beginner'
  },
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      level: 1,
      text: 'Introduction to Testing',
      presentation: {
        align: 'left',
        style: 'default'
      }
    },
    {
      id: 'paragraph-1',
      type: 'paragraph',
      text: 'This is a test paragraph created by the integration test suite.',
      presentation: {
        align: 'left',
        emphasis: 'normal'
      }
    },
    {
      id: 'code-1',
      type: 'code',
      language: 'javascript',
      code: 'const test = "Hello World";\nconsole.log(test);',
      caption: 'Sample JavaScript code',
      presentation: {
        theme: 'dark',
        showLineNumbers: true,
        highlightLines: []
      }
    },
    {
      id: 'list-1',
      type: 'list',
      style: 'bullet',
      items: [
        { id: 'item-1', text: 'First test item' },
        { id: 'item-2', text: 'Second test item' },
        { id: 'item-3', text: 'Third test item' }
      ],
      presentation: {
        spacing: 'comfortable',
        marker: 'disc'
      }
    }
  ]
};

/**
 * Utility: Log section header
 */
function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

/**
 * Utility: Log test result
 */
function logResult(passed, message, details = null) {
  const icon = passed ? '✅' : '❌';
  console.log(`\n${icon} ${message}`);
  if (details) {
    console.log(`   ${JSON.stringify(details, null, 2).split('\n').join('\n   ')}`);
  }
}

/**
 * Test 1: Admin Login
 */
async function testAdminLogin() {
  logSection('TEST 1: Admin Authentication');
  
  try {
    console.log(`Attempting login to: ${BASE_URL}/api/auth/login`);
    console.log(`Email: ${ADMIN_EMAIL}`);
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Login failed: ${error}`);
    }
    
    // Extract token from cookies
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('No Set-Cookie header in login response');
    }
    
    const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
    if (!tokenMatch) {
      throw new Error('No accessToken found in cookies');
    }
    
    adminToken = tokenMatch[1];
    
    logResult(true, 'Admin login successful', {
      tokenPreview: adminToken.substring(0, 20) + '...'
    });
    
    return true;
  } catch (error) {
    logResult(false, 'Admin login failed', { error: error.message });
    throw error;
  }
}

/**
 * Test 2: Get existing subtopic for testing
 */
async function getTestSubtopic() {
  logSection('TEST 2: Get Test Subtopic');
  
  try {
    // Use educational hierarchy API to get a subtopic
    const response = await fetch(`${BASE_URL}/api/admin/hierarchy/subtopics`, {
      headers: {
        'Cookie': `accessToken=${adminToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subtopics: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.subtopics || data.subtopics.length === 0) {
      throw new Error('No subtopics available for testing');
    }
    
    testSubtopicId = data.subtopics[0].id;
    
    logResult(true, 'Test subtopic retrieved', {
      subtopicId: testSubtopicId,
      name: data.subtopics[0].name
    });
    
    return true;
  } catch (error) {
    logResult(false, 'Failed to get test subtopic', { error: error.message });
    // Use a fallback UUID for testing
    testSubtopicId = '00000000-0000-0000-0000-000000000001';
    console.log(`⚠️  Using fallback subtopicId: ${testSubtopicId}`);
    return true;
  }
}

/**
 * Test 3: Create Section (Unauthorized - no token)
 */
async function testCreateSectionUnauthorized() {
  logSection('TEST 3: Create Section (Unauthorized)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'simple',
        content: SAMPLE_DOCUMENT,
        brandId: 'shared',
      }),
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      logResult(true, 'Correctly rejected unauthorized request', {
        status: 401,
        message: 'Authentication required'
      });
      return true;
    } else {
      logResult(false, 'Should have returned 401 for unauthorized request', {
        actualStatus: response.status
      });
      return false;
    }
  } catch (error) {
    logResult(false, 'Test failed with error', { error: error.message });
    return false;
  }
}

/**
 * Test 4: Create Section (Authorized)
 */
async function testCreateSection() {
  logSection('TEST 4: Create Section (Authorized)');
  
  try {
    console.log(`Creating section for subtopic: ${testSubtopicId}`);
    
    const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify({
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'simple',
        content: SAMPLE_DOCUMENT,
        brandId: 'shared',
      }),
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Create section failed: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    createdSectionId = result.data.id;
    
    logResult(true, 'Section created successfully', {
      sectionId: createdSectionId,
      sectionType: result.data.sectionType,
      status: result.data.status,
      blocksCount: result.data.content.blocks.length
    });
    
    return true;
  } catch (error) {
    logResult(false, 'Section creation failed', { error: error.message });
    throw error;
  }
}

/**
 * Test 5: Get Section by ID
 */
async function testGetSection() {
  logSection('TEST 5: Get Section by ID');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${createdSectionId}`,
      {
        headers: {
          'Cookie': `accessToken=${adminToken}`,
        },
      }
    );
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Get section failed: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    
    logResult(true, 'Section retrieved successfully', {
      sectionId: result.data.id,
      title: result.data.content.metadata.title,
      blocksCount: result.data.content.blocks.length
    });
    
    return true;
  } catch (error) {
    logResult(false, 'Get section failed', { error: error.message });
    return false;
  }
}

/**
 * Test 6: List Sections
 */
async function testListSections() {
  logSection('TEST 6: List Sections');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${testSubtopicId}&limit=10`,
      {
        headers: {
          'Cookie': `accessToken=${adminToken}`,
        },
      }
    );
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`List sections failed: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    
    logResult(true, 'Sections listed successfully', {
      count: result.data.length,
      hasMore: result.hasMore,
      total: result.total
    });
    
    return true;
  } catch (error) {
    logResult(false, 'List sections failed', { error: error.message });
    return false;
  }
}

/**
 * Test 7: Update Section
 */
async function testUpdateSection() {
  logSection('TEST 7: Update Section');
  
  try {
    const updatedDocument = {
      ...SAMPLE_DOCUMENT,
      metadata: {
        ...SAMPLE_DOCUMENT.metadata,
        title: 'Updated Test Tutorial Section',
      },
      blocks: [
        ...SAMPLE_DOCUMENT.blocks,
        {
          id: 'paragraph-2',
          type: 'paragraph',
          text: 'This paragraph was added during the update test.',
          presentation: {
            align: 'left',
            emphasis: 'normal'
          }
        }
      ]
    };
    
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${createdSectionId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${adminToken}`,
        },
        body: JSON.stringify({
          content: updatedDocument,
        }),
      }
    );
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Update section failed: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    
    logResult(true, 'Section updated successfully', {
      sectionId: result.data.id,
      newTitle: result.data.content.metadata.title,
      blocksCount: result.data.content.blocks.length,
      version: result.data.version
    });
    
    return true;
  } catch (error) {
    logResult(false, 'Update section failed', { error: error.message });
    return false;
  }
}

/**
 * Test 8: Publish Section
 */
async function testPublishSection() {
  logSection('TEST 8: Publish Section');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${createdSectionId}/publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${adminToken}`,
        },
        body: JSON.stringify({}),
      }
    );
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Publish section failed: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    
    logResult(true, 'Section published successfully', {
      sectionId: result.data.id,
      status: result.data.status,
      publishedAt: result.data.publishedAt
    });
    
    return true;
  } catch (error) {
    logResult(false, 'Publish section failed', { error: error.message });
    return false;
  }
}

/**
 * Test 9: Delete Section (Archive)
 */
async function testDeleteSection() {
  logSection('TEST 9: Delete Section (Archive)');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${createdSectionId}`,
      {
        method: 'DELETE',
        headers: {
          'Cookie': `accessToken=${adminToken}`,
        },
      }
    );
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Delete section failed: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    
    logResult(true, 'Section archived successfully', {
      message: result.message
    });
    
    return true;
  } catch (error) {
    logResult(false, 'Delete section failed', { error: error.message });
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 TUTORIAL COMPOSER API INTEGRATION TEST');
  console.log('==========================================\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };
  
  try {
    // Run tests sequentially
    const tests = [
      { name: 'Admin Login', fn: testAdminLogin, critical: true },
      { name: 'Get Test Subtopic', fn: getTestSubtopic, critical: true },
      { name: 'Create Section (Unauthorized)', fn: testCreateSectionUnauthorized, critical: false },
      { name: 'Create Section (Authorized)', fn: testCreateSection, critical: true },
      { name: 'Get Section by ID', fn: testGetSection, critical: false },
      { name: 'List Sections', fn: testListSections, critical: false },
      { name: 'Update Section', fn: testUpdateSection, critical: false },
      { name: 'Publish Section', fn: testPublishSection, critical: false },
      { name: 'Delete Section', fn: testDeleteSection, critical: false },
    ];
    
    for (const test of tests) {
      results.total++;
      
      try {
        const passed = await test.fn();
        if (passed) {
          results.passed++;
        } else {
          results.failed++;
          if (test.critical) {
            console.log('\n❌ Critical test failed. Stopping test suite.');
            break;
          }
        }
      } catch (error) {
        results.failed++;
        if (test.critical) {
          console.log('\n❌ Critical test failed. Stopping test suite.');
          console.log(`Error: ${error.message}`);
          break;
        }
      }
    }
    
    // Summary
    logSection('TEST SUMMARY');
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.failed === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
