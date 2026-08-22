#!/usr/bin/env node
import 'dotenv/config';

const BASE_URL = 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

async function main() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    const setCookie = loginRes.headers.get('set-cookie');
    const token = setCookie?.match(/accessToken=([^;]+)/)?.[1];
    
    if (!token) {
      throw new Error('Login failed');
    }
    
    console.log('✅ Logged in\n');
    
    // Get hierarchy to find Full Stack Development domain
    const hierarchyRes = await fetch(`${BASE_URL}/api/tutorial-left-sidebar/hierarchy`, {
      headers: { 'Cookie': `accessToken=${token}` }
    });
    
    const hierarchy = await hierarchyRes.json();
    
    const fullStackDomain = hierarchy.domains?.find(d => d.name === 'Full Stack Development');
    if (!fullStackDomain) {
      throw new Error('Full Stack Development domain not found');
    }
    
    console.log(`✅ Found domain: ${fullStackDomain.name} (${fullStackDomain.id})`);
    
    // Get subjects for this domain
    const backendSubject = hierarchy.subjects?.find(s => 
      s.domainId === fullStackDomain.id && s.name === 'Backend Development'
    );
    
    if (!backendSubject) {
      throw new Error('Backend Development subject not found');
    }
    
    console.log(`✅ Found subject: ${backendSubject.name} (${backendSubject.id})`);
    
    // Now we need to fetch topics for this subject
    // The hierarchy API might not return topics, so we need to query them
    console.log('\n📋 Searching for "What Is Java?" subtopic...\n');
    
    // Try to query tutorial sections to find Java-related content
    const sectionsRes = await fetch(`${BASE_URL}/api/tutorial-composer/sections?brandId=shared&limit=100`, {
      headers: { 'Cookie': `accessToken=${token}` }
    });
    
    if (sectionsRes.ok) {
      const sections = await sectionsRes.json();
      console.log(`Found ${sections.data?.length || 0} existing tutorial sections`);
      
      // Look for any section that might be related to Java
      const javaSections = sections.data?.filter(s => 
        JSON.stringify(s.content).toLowerCase().includes('java')
      );
      
      if (javaSections && javaSections.length > 0) {
        console.log(`\nFound ${javaSections.length} Java-related section(s):`);
        javaSections.forEach((section, i) => {
          console.log(`\n${i + 1}. Subtopic ID: ${section.subtopicId}`);
          console.log(`   Section ID: ${section.id}`);
          console.log(`   Status: ${section.status}`);
        });
        
        console.log(`\n✅ You can use this subtopic ID:`);
        console.log(`\n$env:TEST_SUBTOPIC_ID="${javaSections[0].subtopicId}"`);
        console.log('node scripts/test-java-definition-save.mjs\n');
      }
    }
    
    // Alternative: Just provide the known structure based on the UI
    console.log('\n💡 Alternatively, use the Tutorial Page Content UI to:');
    console.log('   1. Select: Full Stack Development > Backend Development > Java > What Is Java?');
    console.log('   2. The subtopic ID will be visible in browser DevTools Network tab');
    console.log('   3. Or just test directly in the UI - the UUID fix is already deployed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
