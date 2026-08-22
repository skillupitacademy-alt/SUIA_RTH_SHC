#!/usr/bin/env node

/**
 * Test Script: Java Definition Block - Save and Publish
 * Tests the specific scenario from user requirement
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';

// Configuration
const BASE_URL = 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillhubcore.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'testing';

// The Java definition payload from user
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

// Test state
let adminToken = null;
let testSubtopicId = null;
let createdSectionId = null;

/**
 * Log with timestamp
 */
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Step 1: Admin Login
 */
async function login() {
  log('STEP 1: Attempting admin login...');
  log(`URL: ${BASE_URL}/api/auth/login`);
  log(`Email: ${ADMIN_EMAIL}`);
  
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
  
  log(`Response Status: ${response.status} ${response.statusText}`);
  
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
  log('✅ Login successful', { tokenPreview: adminToken.substring(0, 30) + '...' });
}

/**
 * Step 2: Get a test subtopic
 */
async function getTestSubtopic() {
  log('\nSTEP 2: Getting test subtopic...');
  
  // First, try environment variable
  if (process.env.TEST_SUBTOPIC_ID) {
    testSubtopicId = process.env.TEST_SUBTOPIC_ID;
    log(`✅ Using subtopic ID from environment: ${testSubtopicId}`);
    return;
  }
  
  // Try to fetch hierarchy and get first available subtopic
  try {
    const response = await fetch(`${BASE_URL}/api/tutorial-left-sidebar/hierarchy`, {
      headers: {
        'Cookie': `accessToken=${adminToken}`,
      },
    });
    
    if (response.ok) {
      const hierarchy = await response.json();
      
      // Navigate to find first subtopic
      if (hierarchy.domains?.length > 0) {
        for (const domain of hierarchy.domains) {
          if (domain.subjects?.length > 0) {
            for (const subject of domain.subjects) {
              if (subject.topics?.length > 0) {
                for (const topic of subject.topics) {
                  if (topic.subtopics?.length > 0) {
                    testSubtopicId = topic.subtopics[0].id;
                    log(`✅ Found subtopic: ${topic.subtopics[0].name} (${testSubtopicId})`);
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    log('⚠️  Could not fetch hierarchy', { error: error.message });
  }
  
  // Fallback: use a test UUID - script will fail if this doesn't exist
  testSubtopicId = '00000000-0000-0000-0000-000000000001';
  log(`⚠️  Using fallback subtopic ID: ${testSubtopicId}`);
  log('⚠️  This will likely fail. Please provide TEST_SUBTOPIC_ID environment variable.');
}

/**
 * Step 3: Create TutorialDocument with Java Definition D1 block
 */
function createTutorialDocument() {
  log('\nSTEP 3: Creating TutorialDocument with Java Definition D1 block...');
  
  // Generate a proper UUID
  const blockId = randomUUID();
  
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
  
  log('✅ TutorialDocument created', {
    schemaVersion: tutorialDocument.schemaVersion,
    blocksCount: tutorialDocument.blocks.length,
    blockId: tutorialDocument.blocks[0].id,
    blockType: tutorialDocument.blocks[0].type,
    blockVersion: tutorialDocument.blocks[0].version,
    blockTitle: tutorialDocument.blocks[0].content.page.title,
  });
  
  return tutorialDocument;
}

/**
 * Step 4: Check if tutorial already exists
 */
async function checkExistingTutorial() {
  log('\nSTEP 4: Checking for existing tutorial...');
  
  const url = `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${testSubtopicId}&brandId=shared&limit=1`;
  log(`GET ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to check existing tutorial: ${response.status}`);
  }
  
  const result = await response.json();
  const existingTutorial = result.data?.[0];
  
  if (existingTutorial) {
    log('✅ Found existing tutorial', {
      id: existingTutorial.id,
      status: existingTutorial.status,
      blocksCount: existingTutorial.content?.blocks?.length || 0,
    });
    createdSectionId = existingTutorial.id;
    return existingTutorial;
  } else {
    log('ℹ️  No existing tutorial found - will create new');
    return null;
  }
}

/**
 * Step 5: Save tutorial (POST or PATCH)
 */
async function saveTutorial(existingTutorial, tutorialDocument) {
  log('\nSTEP 5: Saving tutorial...');
  
  let response;
  let method;
  let url;
  let body;
  
  if (existingTutorial) {
    // PATCH existing
    method = 'PATCH';
    url = `${BASE_URL}/api/tutorial-composer/sections/${existingTutorial.id}`;
    body = {
      content: tutorialDocument,
    };
    
    log(`PATCH ${url}`, {
      sectionId: existingTutorial.id,
      blocksCount: tutorialDocument.blocks.length,
    });
  } else {
    // POST new
    method = 'POST';
    url = `${BASE_URL}/api/tutorial-composer/sections`;
    body = {
      subtopicId: testSubtopicId,
      brandId: 'shared',
      content: tutorialDocument,
      orderIndex: 0,
    };
    
    log(`POST ${url}`, {
      subtopicId: testSubtopicId,
      brandId: 'shared',
      blocksCount: tutorialDocument.blocks.length,
    });
  }
  
  response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
    body: JSON.stringify(body),
  });
  
  log(`Response Status: ${response.status} ${response.statusText}`);
  
  const result = await response.json();
  
  if (!response.ok) {
    log('❌ SAVE FAILED', {
      status: response.status,
      error: result.error,
    });
    throw new Error(`Save failed: ${JSON.stringify(result.error || result)}`);
  }
  
  createdSectionId = result.data.id;
  
  log('✅ Save successful', {
    sectionId: result.data.id,
    status: result.data.status,
    version: result.data.version,
  });
  
  return result.data;
}

/**
 * Step 6: Publish tutorial
 */
async function publishTutorial() {
  log('\nSTEP 6: Publishing tutorial...');
  
  const url = `${BASE_URL}/api/tutorial-composer/sections/${createdSectionId}/publish`;
  log(`POST ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
  });
  
  log(`Response Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const error = await response.json();
    log('❌ PUBLISH FAILED', error);
    throw new Error(`Publish failed: ${JSON.stringify(error)}`);
  }
  
  const result = await response.json();
  
  log('✅ Publish successful', {
    sectionId: result.data.id,
    status: result.data.status,
    publishedAt: result.data.publishedAt,
  });
  
  return result.data;
}

/**
 * Step 7: Verify the saved tutorial
 */
async function verifyTutorial() {
  log('\nSTEP 7: Verifying saved tutorial...');
  
  const url = `${BASE_URL}/api/tutorial-composer/sections/${createdSectionId}`;
  log(`GET ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Cookie': `accessToken=${adminToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to verify tutorial: ${response.status}`);
  }
  
  const result = await response.json();
  
  log('✅ Verification successful', {
    sectionId: result.data.id,
    status: result.data.status,
    blocksCount: result.data.content.blocks.length,
    blockTypes: result.data.content.blocks.map(b => `${b.type}/${b.version || 'N/A'}`),
  });
  
  // Verify the Java definition content
  const definitionBlock = result.data.content.blocks.find(b => b.type === 'definition');
  if (definitionBlock) {
    log('✅ Java Definition block verified', {
      title: definitionBlock.content?.page?.title,
      category: definitionBlock.content?.page?.category,
      characteristicsCount: definitionBlock.content?.page?.characteristics?.length || 0,
    });
  } else {
    log('⚠️  Definition block not found in saved tutorial');
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧪 Java Definition Block - Save and Publish Test');
  console.log('=' .repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=' .repeat(60));
  
  try {
    // Execute test steps
    await login();
    await getTestSubtopic();
    
    const tutorialDocument = createTutorialDocument();
    const existingTutorial = await checkExistingTutorial();
    
    await saveTutorial(existingTutorial, tutorialDocument);
    await publishTutorial();
    await verifyTutorial();
    
    // Success summary
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 TEST COMPLETED SUCCESSFULLY');
    console.log('=' .repeat(60));
    console.log(`Section ID: ${createdSectionId}`);
    console.log(`View at: ${BASE_URL}/tools/tutorial-page-content`);
    console.log('=' .repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('❌ TEST FAILED');
    console.error('=' .repeat(60));
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    console.error('=' .repeat(60));
    
    process.exit(1);
  }
}

// Run
main();
