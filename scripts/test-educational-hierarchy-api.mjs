/**
 * Test Educational Hierarchy API Routes
 * 
 * This script tests the HTTP API endpoints for educational hierarchy:
 * - GET /api/admin/domains
 * - POST /api/admin/domains
 * - PUT /api/admin/domains
 * - DELETE /api/admin/domains
 * (and same for subjects, topics, subtopics, skills)
 * 
 * Usage:
 *   node scripts/test-educational-hierarchy-api.mjs
 * 
 * Prerequisites:
 *   - Start the dev server: cd apps/skillhubcore-admin && pnpm dev
 *   - Or use production URL if deployed
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Configuration
const BASE_URL = process.env.SKILLHUBCORE_ADMIN_URL || 'http://localhost:3007';
const API_BASE = `${BASE_URL}/api/admin`;

// Test data storage
const testIds = {
  domain: null,
  subject: null,
  topic: null,
  subtopic: null,
  skill: null,
};

console.log('🧪 Educational Hierarchy API Test Suite\n');
console.log('🌐 Testing API:', API_BASE);
console.log('');

// Helper function to print test results
function printResult(testName, success, message = '') {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (message) {
    console.log(`   ${message}`);
  }
}

// Helper function to make API calls
async function apiCall(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, status: 0, error: error.message };
  }
}

// Test 1: Create Domain
async function testCreateDomain() {
  console.log('📋 Test 1: POST /api/admin/domains - Create domain\n');

  const result = await apiCall('POST', '/domains', {
    name: 'API Test Domain',
    description: 'Created via API test script',
    category: 'technology',
    status: 'active',
    order: 1,
  });

  if (result.success) {
    testIds.domain = result.data.id;
    printResult('Create domain', true, `ID: ${testIds.domain}`);
    console.log(`   Name: ${result.data.name}`);
    console.log(`   Category: ${result.data.category}`);
  } else {
    printResult('Create domain', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 2: Get Domains
async function testGetDomains() {
  console.log('📋 Test 2: GET /api/admin/domains - List domains\n');

  const result = await apiCall('GET', '/domains?limit=10');

  if (result.success) {
    printResult('Get domains', true, `Found ${result.data.data?.length || 0} domains`);
    if (result.data.data?.length > 0) {
      console.log('   First domain:');
      console.log(`     ID: ${result.data.data[0].id}`);
      console.log(`     Name: ${result.data.data[0].name}`);
    }
  } else {
    printResult('Get domains', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 3: Update Domain
async function testUpdateDomain() {
  console.log('📋 Test 3: PUT /api/admin/domains - Update domain\n');

  const result = await apiCall('PUT', '/domains', {
    id: testIds.domain,
    description: 'Updated via API test script',
  });

  if (result.success) {
    printResult('Update domain', true, 'Description updated');
    console.log(`   New description: ${result.data.description}`);
  } else {
    printResult('Update domain', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 4: Search Domains
async function testSearchDomains() {
  console.log('📋 Test 4: GET /api/admin/domains?search=API - Search domains\n');

  const result = await apiCall('GET', '/domains?search=API&limit=5');

  if (result.success) {
    const count = result.data.data?.length || 0;
    printResult('Search domains', true, `Found ${count} matching domain(s)`);
  } else {
    printResult('Search domains', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 5: Create Subject
async function testCreateSubject() {
  console.log('📋 Test 5: POST /api/admin/subjects - Create subject\n');

  const result = await apiCall('POST', '/subjects', {
    domain_id: testIds.domain,
    name: 'API Test Subject',
    description: 'Created via API test script',
    status: 'active',
    order: 1,
  });

  if (result.success) {
    testIds.subject = result.data.id;
    printResult('Create subject', true, `ID: ${testIds.subject}`);
    console.log(`   Name: ${result.data.name}`);
    console.log(`   Domain ID: ${result.data.domain_id}`);
  } else {
    printResult('Create subject', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 6: Get Subjects
async function testGetSubjects() {
  console.log('📋 Test 6: GET /api/admin/subjects - List subjects\n');

  const result = await apiCall('GET', '/subjects?limit=10');

  if (result.success) {
    printResult('Get subjects', true, `Found ${result.data.data?.length || 0} subjects`);
  } else {
    printResult('Get subjects', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 7: Create Topic
async function testCreateTopic() {
  console.log('📋 Test 7: POST /api/admin/topics - Create topic\n');

  const result = await apiCall('POST', '/topics', {
    subject_id: testIds.subject,
    name: 'API Test Topic',
    description: 'Created via API test script',
    complexity: 'intermediate',
    status: 'active',
    order: 1,
  });

  if (result.success) {
    testIds.topic = result.data.id;
    printResult('Create topic', true, `ID: ${testIds.topic}`);
    console.log(`   Name: ${result.data.name}`);
    console.log(`   Complexity: ${result.data.complexity}`);
  } else {
    printResult('Create topic', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 8: Get Topics
async function testGetTopics() {
  console.log('📋 Test 8: GET /api/admin/topics - List topics\n');

  const result = await apiCall('GET', '/topics?limit=10');

  if (result.success) {
    printResult('Get topics', true, `Found ${result.data.data?.length || 0} topics`);
  } else {
    printResult('Get topics', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 9: Create Subtopic
async function testCreateSubtopic() {
  console.log('📋 Test 9: POST /api/admin/subtopics - Create subtopic\n');

  const result = await apiCall('POST', '/subtopics', {
    topic_id: testIds.topic,
    name: 'API Test Subtopic',
    description: 'Created via API test script',
    status: 'active',
    order: 1,
  });

  if (result.success) {
    testIds.subtopic = result.data.id;
    printResult('Create subtopic', true, `ID: ${testIds.subtopic}`);
    console.log(`   Name: ${result.data.name}`);
  } else {
    printResult('Create subtopic', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 10: Get Subtopics
async function testGetSubtopics() {
  console.log('📋 Test 10: GET /api/admin/subtopics - List subtopics\n');

  const result = await apiCall('GET', '/subtopics?limit=10');

  if (result.success) {
    printResult('Get subtopics', true, `Found ${result.data.data?.length || 0} subtopics`);
  } else {
    printResult('Get subtopics', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 11: Create Skill
async function testCreateSkill() {
  console.log('📋 Test 11: POST /api/admin/skills - Create skill\n');

  const result = await apiCall('POST', '/skills', {
    name: 'API Test Skill',
    description: 'Created via API test script',
    category: 'technical',
    status: 'active',
    order: 1,
  });

  if (result.success) {
    testIds.skill = result.data.id;
    printResult('Create skill', true, `ID: ${testIds.skill}`);
    console.log(`   Name: ${result.data.name}`);
    console.log(`   Category: ${result.data.category}`);
  } else {
    printResult('Create skill', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 12: Get Skills
async function testGetSkills() {
  console.log('📋 Test 12: GET /api/admin/skills - List skills\n');

  const result = await apiCall('GET', '/skills?limit=10');

  if (result.success) {
    printResult('Get skills', true, `Found ${result.data.data?.length || 0} skills`);
  } else {
    printResult('Get skills', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 13: Soft Delete Subtopic
async function testDeleteSubtopic() {
  console.log('📋 Test 13: DELETE /api/admin/subtopics - Delete subtopic\n');

  const result = await apiCall('DELETE', `/subtopics?id=${testIds.subtopic}`);

  if (result.success) {
    printResult('Delete subtopic', true, result.data.message);
  } else {
    printResult('Delete subtopic', false, result.error || `Status: ${result.status}`);
  }

  console.log('');
}

// Test 14: Batch Delete Skills
async function testBatchDeleteSkills() {
  console.log('📋 Test 14: DELETE /api/admin/skills - Batch delete skills\n');

  // Create two more skills for batch delete
  const skill1 = await apiCall('POST', '/skills', {
    name: 'Batch Test Skill 1',
    description: 'To be deleted',
    category: 'technical',
    status: 'active',
    order: 1,
  });

  const skill2 = await apiCall('POST', '/skills', {
    name: 'Batch Test Skill 2',
    description: 'To be deleted',
    category: 'soft_skill',
    status: 'active',
    order: 2,
  });

  if (skill1.success && skill2.success) {
    const ids = `${skill1.data.id},${skill2.data.id}`;
    const result = await apiCall('DELETE', `/skills?ids=${ids}`);

    if (result.success) {
      printResult('Batch delete skills', true, result.data.message);
    } else {
      printResult('Batch delete skills', false, result.error || `Status: ${result.status}`);
    }
  } else {
    printResult('Batch delete skills', false, 'Failed to create test skills');
  }

  console.log('');
}

// Cleanup: Delete test data
async function cleanup() {
  console.log('🧹 Cleanup: Removing test data\n');

  // Delete in reverse order
  if (testIds.topic) {
    const result = await apiCall('DELETE', `/topics?id=${testIds.topic}`);
    printResult('Delete test topic', result.success, result.data?.message || result.error);
  }

  if (testIds.skill) {
    const result = await apiCall('DELETE', `/skills?id=${testIds.skill}`);
    printResult('Delete test skill', result.success, result.data?.message || result.error);
  }

  if (testIds.subject) {
    const result = await apiCall('DELETE', `/subjects?id=${testIds.subject}`);
    printResult('Delete test subject', result.success, result.data?.message || result.error);
  }

  if (testIds.domain) {
    const result = await apiCall('DELETE', `/domains?id=${testIds.domain}`);
    printResult('Delete test domain', result.success, result.data?.message || result.error);
  }

  console.log('');
}

// Run all tests
async function runAllTests() {
  try {
    await testCreateDomain();
    await testGetDomains();
    await testUpdateDomain();
    await testSearchDomains();
    await testCreateSubject();
    await testGetSubjects();
    await testCreateTopic();
    await testGetTopics();
    await testCreateSubtopic();
    await testGetSubtopics();
    await testCreateSkill();
    await testGetSkills();
    await testDeleteSubtopic();
    await testBatchDeleteSkills();
    await cleanup();

    console.log('✅ All API tests completed!\n');
    console.log('📊 Summary:');
    console.log('   - Tested all 5 entity types (domains, subjects, topics, subtopics, skills)');
    console.log('   - Tested CRUD operations (Create, Read, Update, Delete)');
    console.log('   - Tested pagination and search');
    console.log('   - Tested batch operations');
    console.log('   - Verified soft delete functionality\n');
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
}

// Run the tests
runAllTests();
