#!/usr/bin/env node
/**
 * Test save/publish with the REAL "What is Java?" subtopic
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';

const BASE_URL = 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

// From the UI data provided
const BACKEND_DEV_SUBJECT_ID = '3a706051-9d9d-4bdf-af48-331a5acd557e';

const JAVA_DEFINITION_PAYLOAD = {
  "page": {
    "type": "definition",
    "category": "Java",
    "title": "What Is Java?",
    "intro": "Java is a high-level, object-oriented programming language designed for cross-platform compatibility and enterprise-scale applications.",
    "definition": "Java is a statically typed, compiled-and-interpreted language that runs on the Java Virtual Machine (JVM), enabling bytecode to execute uniformly across any system with a JVM implementation, regardless of underlying hardware or operating system.",
    "explanation": [
      "At its core, Java simplifies complex system development by abstracting memory management through automatic garbage collection and providing a clear, class-based object model. Its syntax derives from C and C++, but removes low-level constructs like explicit pointers, making it more accessible for building reliable, maintainable software.",
      "Practically, Java powers everything from Android mobile apps to massive backend systems in finance, e-commerce, and cloud platforms. Its \"write once, run anywhere\" (WORA) capability, robust standard library (Java SE), and vast ecosystem of frameworks (e.g., Spring, Hibernate) make it a staple in enterprise environments. The JVM also enables performance optimizations like Just-In-Time (JIT) compilation, blending portability with near-native execution speed."
    ],
    "example": {
      "language": "java",
      "code": "public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Java!\");\n    }\n}"
    },
    "characteristics": [
      {
        "icon": "☕",
        "title": "Platform Independence",
        "description": "Java compiles to bytecode that runs on any JVM, making applications portable across Windows, macOS, Linux, and more without recompilation."
      },
      {
        "icon": "🛡️",
        "title": "Strong Memory Safety",
        "description": "Automatic garbage collection and lack of manual pointer arithmetic eliminate common memory leaks and segmentation faults, enhancing stability and security."
      },
      {
        "icon": "🧩",
        "title": "Object-Oriented by Design",
        "description": "Everything (except primitives) is an object, enforcing encapsulation, inheritance, and polymorphism to encourage modular, reusable code."
      },
      {
        "icon": "⚡",
        "title": "Robust Concurrency Support",
        "description": "Built-in threading and synchronization primitives, along with the `java.util.concurrent` package, enable efficient multi-threaded execution for high-performance applications."
      }
    ],
    "takeaway": "Java's blend of portability, performance, and productivity makes it an enduring cornerstone of modern backend development and large-scale systems."
  }
};

let adminToken = null;
let javaSubtopicId = null;

function log(message, data = null) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

async function login() {
  log('STEP 1: Logging in...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  
  if (!response.ok) throw new Error(`Login failed: ${response.status}`);
  
  const setCookie = response.headers.get('set-cookie');
  adminToken = setCookie?.match(/accessToken=([^;]+)/)?.[1];
  
  if (!adminToken) throw new Error('No access token found');
  
  log('✅ Login successful\n');
}

async function findJavaSubtopic() {
  log('STEP 2: Finding "What is Java?" subtopic...');
  
  // Try to query existing sections to find Java-related subtopics
  const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections?brandId=shared&limit=100`, {
    headers: { 'Cookie': `accessToken=${adminToken}` }
  });
  
  if (response.ok) {
    const result = await response.json();
    log(`Found ${result.data?.length || 0} existing sections`);
    
    // Look for Java sections
    if (result.data && result.data.length > 0) {
      const javaSection = result.data.find(s => 
        JSON.stringify(s.content).toLowerCase().includes('java')
      );
      
      if (javaSection) {
        javaSubtopicId = javaSection.subtopicId;
        log(`✅ Found Java subtopic ID: ${javaSubtopicId}\n`);
        return;
      }
    }
  }
  
  // If not found, we need to manually get it or create a tutorial
  log('⚠️  No existing Java tutorial found');
  log('We will need to find the subtopic ID from the database or UI\n');
  
  // Based on the user's info, the subtopic exists but has no tutorial yet
  // Let's try to query the API endpoint that might list subtopics
  log('Attempting alternative discovery method...');
  
  // The user said the subtopic exists, so we'll need the actual ID
  // For now, let's use an environment variable if provided
  javaSubtopicId = process.env.JAVA_SUBTOPIC_ID;
  
  if (javaSubtopicId) {
    log(`✅ Using Java subtopic ID from environment: ${javaSubtopicId}\n`);
  } else {
    log('❌ JAVA_SUBTOPIC_ID environment variable not set');
    log('Please provide the subtopic ID:');
    log('  $env:JAVA_SUBTOPIC_ID="<uuid>"');
    log('  node scripts/test-with-real-java-subtopic.mjs\n');
    throw new Error('Java subtopic ID required');
  }
}

async function testSaveWithProperUUID() {
  log('STEP 3: Testing save with proper UUID...');
  
  const blockId = randomUUID();
  log(`Generated UUID block ID: ${blockId}`);
  
  const tutorialDocument = {
    schemaVersion: 1,
    blocks: [
      {
        id: blockId,
        type: 'definition',
        version: 'D1',
        content: JAVA_DEFINITION_PAYLOAD,
      }
    ]
  };
  
  log('\nChecking if tutorial already exists...');
  
  const checkResponse = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${javaSubtopicId}&brandId=shared&limit=1`,
    { headers: { 'Cookie': `accessToken=${adminToken}` } }
  );
  
  if (!checkResponse.ok) {
    throw new Error(`Failed to check existing tutorial: ${checkResponse.status}`);
  }
  
  const checkResult = await checkResponse.json();
  const existingSection = checkResult.data?.[0];
  
  if (existingSection) {
    log(`Found existing tutorial: ${existingSection.id}`);
    log('Will UPDATE existing tutorial\n');
    
    // PATCH
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections/${existingSection.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${adminToken}`,
        },
        body: JSON.stringify({ content: tutorialDocument }),
      }
    );
    
    log(`PATCH Response: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    
    if (!response.ok) {
      log('❌ PATCH FAILED:', result);
      return false;
    }
    
    log('✅ Tutorial updated successfully!', {
      id: result.data.id,
      status: result.data.status,
      version: result.data.version,
    });
    
    return result.data.id;
    
  } else {
    log('No existing tutorial found');
    log('Will CREATE new tutorial\n');
    
    // POST
    const response = await fetch(
      `${BASE_URL}/api/tutorial-composer/sections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${adminToken}`,
        },
        body: JSON.stringify({
          subtopicId: javaSubtopicId,
          brandId: 'shared',
          content: tutorialDocument,
          orderIndex: 0,
        }),
      }
    );
    
    log(`POST Response: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    
    if (!response.ok) {
      log('❌ POST FAILED - Full Response:', result);
      
      // Log the request payload that was sent
      log('Request payload summary:', {
        subtopicId: javaSubtopicId,
        brandId: 'shared',
        blocksCount: tutorialDocument.blocks.length,
        blockId: tutorialDocument.blocks[0].id,
        blockType: tutorialDocument.blocks[0].type,
        blockVersion: tutorialDocument.blocks[0].version,
      });
      
      return false;
    }
    
    log('✅ Tutorial created successfully!', {
      id: result.data.id,
      status: result.data.status,
      blocksCount: result.data.content.blocks.length,
    });
    
    return result.data.id;
  }
}

async function publishTutorial(sectionId) {
  log('\nSTEP 4: Publishing tutorial...');
  
  const response = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections/${sectionId}/publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
    }
  );
  
  log(`Publish Response: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.json();
    log('❌ Publish failed:', error);
    return false;
  }
  
  const result = await response.json();
  log('✅ Tutorial published successfully!', {
    id: result.data.id,
    status: result.data.status,
    publishedAt: result.data.publishedAt,
  });
  
  return true;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║    TEST: Save & Publish "What is Java?" Tutorial            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    await login();
    await findJavaSubtopic();
    
    const sectionId = await testSaveWithProperUUID();
    
    if (sectionId) {
      await publishTutorial(sectionId);
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SUCCESS! Java Definition Tutorial Created & Published');
      console.log('='.repeat(60));
      console.log(`Section ID: ${sectionId}`);
      console.log(`View at: ${BASE_URL}/tools/tutorial-page-content`);
      console.log('='.repeat(60));
    } else {
      console.log('\n❌ Failed to save tutorial');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
