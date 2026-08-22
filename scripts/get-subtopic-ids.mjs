#!/usr/bin/env node
import 'dotenv/config';

const BASE_URL = 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

async function main() {
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD 
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    
    const setCookie = loginRes.headers.get('set-cookie');
    const token = setCookie?.match(/accessToken=([^;]+)/)?.[1];
    
    if (!token) {
      throw new Error('No access token received');
    }
    
    console.log('✅ Logged in successfully\n');
    
    // Step 2: Fetch hierarchy
    console.log('📋 Fetching hierarchy...');
    const hierarchyRes = await fetch(`${BASE_URL}/api/tutorial-left-sidebar/hierarchy`, {
      headers: { 'Cookie': `accessToken=${token}` }
    });
    
    if (!hierarchyRes.ok) {
      throw new Error(`Hierarchy fetch failed: ${hierarchyRes.status}`);
    }
    
    const hierarchy = await hierarchyRes.json();
    
    console.log('✅ Hierarchy fetched\n');
    console.log('=' .repeat(80));
    console.log('AVAILABLE SUBTOPICS');
    console.log('=' .repeat(80));
    console.log('');
    
    let count = 0;
    let firstSubtopicId = null;
    
    for (const domain of hierarchy.domains || []) {
      for (const subject of domain.subjects || []) {
        for (const topic of subject.topics || []) {
          for (const subtopic of topic.subtopics || []) {
            count++;
            
            if (count === 1) {
              firstSubtopicId = subtopic.id;
            }
            
            console.log(`${count}. ${subtopic.name}`);
            console.log(`   Path: ${domain.name} > ${subject.name} > ${topic.name}`);
            console.log(`   ID: ${subtopic.id}`);
            console.log('');
            
            if (count >= 10) break;
          }
          if (count >= 10) break;
        }
        if (count >= 10) break;
      }
      if (count >= 10) break;
    }
    
    console.log('=' .repeat(80));
    
    if (count === 0) {
      console.log('\n❌ No subtopics found in hierarchy');
      return;
    }
    
    console.log(`\n✅ Found ${count} subtopic(s)`);
    console.log('\nTo test with the first subtopic, run:\n');
    console.log(`  $env:TEST_SUBTOPIC_ID="${firstSubtopicId}"`);
    console.log('  node scripts/test-java-definition-save.mjs');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
