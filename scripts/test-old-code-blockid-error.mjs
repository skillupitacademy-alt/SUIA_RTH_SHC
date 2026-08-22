#!/usr/bin/env node
/**
 * Test the CURRENTLY DEPLOYED (OLD) code at admin.skillhubcore.in
 * to reproduce the "Invalid uuid" error with non-UUID block IDs
 */

import 'dotenv/config';

const BASE_URL = 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';

// The Java definition payload
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

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function login() {
  log('STEP 1: Logging in...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const setCookie = response.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/accessToken=([^;]+)/);
  
  if (!tokenMatch) {
    throw new Error('No access token found');
  }
  
  adminToken = tokenMatch[1];
  log('✅ Login successful');
}

async function testWithBadBlockId() {
  log('\n🧪 TEST 1: Using OLD-STYLE block ID (should fail with "Invalid uuid")');
  
  // Simulate what the OLD deployed code generates
  const badBlockId = `block-definition-d1-${Date.now().toString(36)}`;
  
  log(`Generated block ID (OLD style): ${badBlockId}`);
  
  const tutorialDocument = {
    schemaVersion: 1,
    blocks: [
      {
        id: badBlockId,  // ❌ This is NOT a valid UUID
        type: 'definition',
        version: 'D1',
        content: JAVA_DEFINITION_PAYLOAD,
      }
    ]
  };
  
  // Use a test subtopic ID (will fail at validation before DB check)
  const testSubtopicId = '00000000-0000-0000-0000-000000000001';
  
  log('\nAttempting to save with bad block ID...');
  
  const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
    body: JSON.stringify({
      subtopicId: testSubtopicId,
      brandId: 'shared',
      content: tutorialDocument,
      orderIndex: 0,
    }),
  });
  
  log(`\nResponse Status: ${response.status} ${response.statusText}`);
  
  const result = await response.json();
  
  if (!response.ok) {
    log('\n❌ EXPECTED FAILURE - Invalid block ID error:', {
      status: response.status,
      error: result.error,
    });
    
    // Check if it's the UUID validation error
    if (result.error?.details?.some(d => d.path === 'content.blocks.0.id' && d.message.includes('uuid'))) {
      log('\n✅ CONFIRMED: Error is "Invalid uuid" at content.blocks.0.id');
      log('This is the bug we fixed!');
      return true;
    }
  } else {
    log('\n⚠️  Unexpected success - API accepted invalid block ID');
    return false;
  }
}

async function testWithGoodBlockId() {
  log('\n\n🧪 TEST 2: Using PROPER UUID block ID (what the fix does)');
  
  // Generate a proper UUID
  const goodBlockId = crypto.randomUUID();
  
  log(`Generated block ID (NEW style): ${goodBlockId}`);
  
  const tutorialDocument = {
    schemaVersion: 1,
    blocks: [
      {
        id: goodBlockId,  // ✅ Valid UUID
        type: 'definition',
        version: 'D1',
        content: JAVA_DEFINITION_PAYLOAD,
      }
    ]
  };
  
  const testSubtopicId = '00000000-0000-0000-0000-000000000001';
  
  log('\nAttempting to save with good UUID...');
  
  const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
    body: JSON.stringify({
      subtopicId: testSubtopicId,
      brandId: 'shared',
      content: tutorialDocument,
      orderIndex: 0,
    }),
  });
  
  log(`\nResponse Status: ${response.status} ${response.statusText}`);
  
  const result = await response.json();
  
  if (!response.ok) {
    log('\n⚠️  Failed with proper UUID:', {
      status: response.status,
      error: result.error,
    });
    
    // Check if it's still UUID error or a different error
    const uuidError = result.error?.details?.some(d => d.path === 'content.blocks.0.id' && d.message.includes('uuid'));
    
    if (uuidError) {
      log('\n❌ Still getting UUID error - this should not happen!');
      return false;
    } else {
      log('\n✅ UUID validation passed! (Failed for different reason - likely invalid subtopicId)');
      return true;
    }
  } else {
    log('\n✅ Success! UUID validation passed and tutorial created');
    return true;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST: Reproduce "Invalid uuid" error on DEPLOYED OLD CODE  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    await login();
    
    const test1Result = await testWithBadBlockId();
    const test2Result = await testWithGoodBlockId();
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Test 1 (Bad ID):  ${test1Result ? '✅ Confirmed bug' : '❌ Unexpected'}`);
    console.log(`Test 2 (Good ID): ${test2Result ? '✅ UUID validation passes' : '❌ Failed'}`);
    console.log('='.repeat(60));
    
    if (test1Result && test2Result) {
      console.log('\n✅ ROOT CAUSE CONFIRMED:');
      console.log('   Block ID must be a valid UUID');
      console.log('   Fix: Use crypto.randomUUID() instead of Date.now() string');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
