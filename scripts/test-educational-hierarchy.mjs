/**
 * Test Educational Hierarchy CRUD Operations
 * 
 * This script tests all CRUD operations for the educational hierarchy:
 * - Domains
 * - Subjects
 * - Topics
 * - Subtopics
 * - Skills
 * 
 * Usage:
 *   node scripts/test-educational-hierarchy.mjs
 * 
 * Environment:
 *   Reads from .env.local
 *   Uses SKILLHUBCORE_DATABASE_URL or DATABASE_URL_TUTORIAL
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Database connection
const databaseUrl = process.env.SKILLHUBCORE_DATABASE_URL || 
                    process.env.DATABASE_URL_TUTORIAL;

if (!databaseUrl) {
  console.error('❌ No database URL found');
  console.error('Please set SKILLHUBCORE_DATABASE_URL or DATABASE_URL_TUTORIAL in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

// Test data storage
const testIds = {
  domain: null,
  subject: null,
  topic: null,
  subtopic: null,
  skill: null,
};

console.log('🧪 Educational Hierarchy CRUD Test Suite\n');
console.log('📊 Testing database:', databaseUrl.replace(/:[^:]*@/, ':****@'));
console.log('');

// Helper function to print test results
function printResult(testName, success, message = '') {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (message) {
    console.log(`   ${message}`);
  }
}

// Test 1: Check if tables exist
async function testTablesExist() {
  console.log('📋 Test 1: Checking if tables exist\n');
  
  const tables = ['domains', 'subjects', 'topics', 'subtopics', 'skills', 'topic_skills'];
  
  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      printResult(`Table "${table}" exists`, exists);
    } catch (error) {
      printResult(`Table "${table}" check`, false, error.message);
    }
  }
  
  console.log('');
}

// Test 2: Create Domain
async function testCreateDomain() {
  console.log('📋 Test 2: Creating a test domain\n');
  
  try {
    const result = await pool.query(`
      INSERT INTO domains (name, description, category, status, "order")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, ['Test Domain', 'This is a test domain for educational hierarchy', 'technology', 'active', 1]);
    
    testIds.domain = result.rows[0].id;
    printResult('Create domain', true, `ID: ${testIds.domain}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Category: ${result.rows[0].category}`);
    console.log(`   Status: ${result.rows[0].status}`);
  } catch (error) {
    printResult('Create domain', false, error.message);
  }
  
  console.log('');
}

// Test 3: Read Domain
async function testReadDomain() {
  console.log('📋 Test 3: Reading domain by ID\n');
  
  try {
    const result = await pool.query(`
      SELECT * FROM domains WHERE id = $1 AND deleted_at IS NULL;
    `, [testIds.domain]);
    
    const found = result.rows.length > 0;
    printResult('Read domain', found, found ? `Found: ${result.rows[0].name}` : 'Not found');
  } catch (error) {
    printResult('Read domain', false, error.message);
  }
  
  console.log('');
}

// Test 4: Update Domain
async function testUpdateDomain() {
  console.log('📋 Test 4: Updating domain\n');
  
  try {
    const result = await pool.query(`
      UPDATE domains 
      SET description = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `, ['Updated description for test domain', testIds.domain]);
    
    const updated = result.rows.length > 0;
    printResult('Update domain', updated, updated ? 'Description updated' : 'Update failed');
  } catch (error) {
    printResult('Update domain', false, error.message);
  }
  
  console.log('');
}

// Test 5: Create Subject
async function testCreateSubject() {
  console.log('📋 Test 5: Creating a test subject\n');
  
  try {
    const result = await pool.query(`
      INSERT INTO subjects (domain_id, name, description, status, "order")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [testIds.domain, 'Test Subject', 'This is a test subject', 'active', 1]);
    
    testIds.subject = result.rows[0].id;
    printResult('Create subject', true, `ID: ${testIds.subject}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Domain ID: ${result.rows[0].domain_id}`);
  } catch (error) {
    printResult('Create subject', false, error.message);
  }
  
  console.log('');
}

// Test 6: Create Topic
async function testCreateTopic() {
  console.log('📋 Test 6: Creating a test topic\n');
  
  try {
    const result = await pool.query(`
      INSERT INTO topics (subject_id, name, description, complexity, status, "order")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [testIds.subject, 'Test Topic', 'This is a test topic', 'beginner', 'active', 1]);
    
    testIds.topic = result.rows[0].id;
    printResult('Create topic', true, `ID: ${testIds.topic}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Subject ID: ${result.rows[0].subject_id}`);
    console.log(`   Complexity: ${result.rows[0].complexity}`);
  } catch (error) {
    printResult('Create topic', false, error.message);
  }
  
  console.log('');
}

// Test 7: Create Subtopic
async function testCreateSubtopic() {
  console.log('📋 Test 7: Creating a test subtopic\n');
  
  try {
    const result = await pool.query(`
      INSERT INTO subtopics (topic_id, name, description, status, "order")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [testIds.topic, 'Test Subtopic', 'This is a test subtopic', 'active', 1]);
    
    testIds.subtopic = result.rows[0].id;
    printResult('Create subtopic', true, `ID: ${testIds.subtopic}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Topic ID: ${result.rows[0].topic_id}`);
  } catch (error) {
    printResult('Create subtopic', false, error.message);
  }
  
  console.log('');
}

// Test 8: Create Skill
async function testCreateSkill() {
  console.log('📋 Test 8: Creating a test skill\n');
  
  try {
    const result = await pool.query(`
      INSERT INTO skills (name, description, category, status, "order")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, ['Test Skill', 'This is a test skill', 'technical', 'active', 1]);
    
    testIds.skill = result.rows[0].id;
    printResult('Create skill', true, `ID: ${testIds.skill}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Category: ${result.rows[0].category}`);
  } catch (error) {
    printResult('Create skill', false, error.message);
  }
  
  console.log('');
}

// Test 9: Create Topic-Skill Relationship
async function testCreateTopicSkill() {
  console.log('📋 Test 9: Creating topic-skill relationship\n');
  
  try {
    const result = await pool.query(`
      INSERT INTO topic_skills (topic_id, skill_id)
      VALUES ($1, $2)
      RETURNING *;
    `, [testIds.topic, testIds.skill]);
    
    printResult('Create topic-skill relationship', true, `Topic ${testIds.topic} linked to Skill ${testIds.skill}`);
  } catch (error) {
    printResult('Create topic-skill relationship', false, error.message);
  }
  
  console.log('');
}

// Test 10: Query Hierarchy
async function testQueryHierarchy() {
  console.log('📋 Test 10: Querying complete hierarchy\n');
  
  try {
    const result = await pool.query(`
      SELECT 
        d.id as domain_id,
        d.name as domain_name,
        s.id as subject_id,
        s.name as subject_name,
        t.id as topic_id,
        t.name as topic_name,
        st.id as subtopic_id,
        st.name as subtopic_name
      FROM domains d
      LEFT JOIN subjects s ON s.domain_id = d.id
      LEFT JOIN topics t ON t.subject_id = s.id
      LEFT JOIN subtopics st ON st.topic_id = t.id
      WHERE d.id = $1
        AND d.deleted_at IS NULL
        AND (s.deleted_at IS NULL OR s.id IS NULL)
        AND (t.deleted_at IS NULL OR t.id IS NULL)
        AND (st.deleted_at IS NULL OR st.id IS NULL);
    `, [testIds.domain]);
    
    printResult('Query hierarchy', result.rows.length > 0);
    console.log(`   Found ${result.rows.length} record(s)`);
    if (result.rows.length > 0) {
      console.log('   Hierarchy:');
      console.log(`     Domain: ${result.rows[0].domain_name}`);
      console.log(`     └─ Subject: ${result.rows[0].subject_name}`);
      console.log(`        └─ Topic: ${result.rows[0].topic_name}`);
      console.log(`           └─ Subtopic: ${result.rows[0].subtopic_name}`);
    }
  } catch (error) {
    printResult('Query hierarchy', false, error.message);
  }
  
  console.log('');
}

// Test 11: Soft Delete
async function testSoftDelete() {
  console.log('📋 Test 11: Testing soft delete\n');
  
  try {
    // Soft delete the subtopic
    const result = await pool.query(`
      UPDATE subtopics
      SET deleted_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [testIds.subtopic]);
    
    printResult('Soft delete subtopic', result.rows.length > 0);
    
    // Verify it's not returned in queries
    const verify = await pool.query(`
      SELECT * FROM subtopics WHERE id = $1 AND deleted_at IS NULL;
    `, [testIds.subtopic]);
    
    printResult('Verify soft delete (should not be found)', verify.rows.length === 0);
  } catch (error) {
    printResult('Soft delete', false, error.message);
  }
  
  console.log('');
}

// Test 12: Count Records
async function testCountRecords() {
  console.log('📋 Test 12: Counting all records\n');
  
  const tables = ['domains', 'subjects', 'topics', 'subtopics', 'skills', 'topic_skills'];
  
  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count FROM ${table}
        WHERE deleted_at IS NULL OR deleted_at IS NOT NULL;
      `);
      
      const count = parseInt(result.rows[0].count);
      console.log(`   ${table}: ${count} record(s)`);
    } catch (error) {
      console.log(`   ${table}: Error - ${error.message}`);
    }
  }
  
  console.log('');
}

// Cleanup: Delete test data
async function cleanup() {
  console.log('🧹 Cleanup: Removing test data\n');
  
  try {
    // Delete in reverse order to respect foreign key constraints
    if (testIds.subtopic) {
      await pool.query('DELETE FROM subtopics WHERE id = $1;', [testIds.subtopic]);
      printResult('Delete test subtopic', true);
    }
    
    if (testIds.skill && testIds.topic) {
      await pool.query('DELETE FROM topic_skills WHERE topic_id = $1 AND skill_id = $2;', [testIds.topic, testIds.skill]);
      printResult('Delete topic-skill relationship', true);
    }
    
    if (testIds.skill) {
      await pool.query('DELETE FROM skills WHERE id = $1;', [testIds.skill]);
      printResult('Delete test skill', true);
    }
    
    if (testIds.topic) {
      await pool.query('DELETE FROM topics WHERE id = $1;', [testIds.topic]);
      printResult('Delete test topic', true);
    }
    
    if (testIds.subject) {
      await pool.query('DELETE FROM subjects WHERE id = $1;', [testIds.subject]);
      printResult('Delete test subject', true);
    }
    
    if (testIds.domain) {
      await pool.query('DELETE FROM domains WHERE id = $1;', [testIds.domain]);
      printResult('Delete test domain', true);
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
  
  console.log('');
}

// Run all tests
async function runAllTests() {
  try {
    await testTablesExist();
    await testCreateDomain();
    await testReadDomain();
    await testUpdateDomain();
    await testCreateSubject();
    await testCreateTopic();
    await testCreateSubtopic();
    await testCreateSkill();
    await testCreateTopicSkill();
    await testQueryHierarchy();
    await testSoftDelete();
    await testCountRecords();
    await cleanup();
    
    console.log('✅ All tests completed!\n');
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await pool.end();
  }
}

// Run the tests
runAllTests();
