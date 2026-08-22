#!/usr/bin/env node
/**
 * Test the DEPLOYED server code at admin.skillhubcore.in
 * Using OLD-style block ID (Date.now string) to reproduce the 400 error
 */

import 'dotenv/config';

const BASE_URL = 'https://admin.skillhubcore.in';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';
const JAVA_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

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

async function testWithOldStyleBlockId() {
  log('TEST 1: Using OLD-STYLE block ID (simulating deployed frontend code)');
  log('=' .repeat(70));
  
  // Simulate what the OLD deployed code generates
  // This mimics: `block-${form.blockType}-${selectedVersion.code.toLowerCase()}-${Date.now().toString(36)}`
  const badBlockId = `block-definition-d1-${Date.now().toString(36)}`;
  
  log(`\nGenerated block ID (OLD style): ${badBlockId}`);
  log('Expected: 400 "Invalid uuid" error\n');
  
  const tutorialDocument = {
    schemaVersion: 1,
    blocks: [
      {
        id: badBlockId,  // ❌ NOT a valid UUID
        type: 'definition',
        version: 'D1',
        content: JAVA_DEFINITION_PAYLOAD,
      }
    ]
  };
  
  const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
    body: JSON.stringify({
      subtopicId: JAVA_SUBTOPIC_ID,
      brandId: 'shared',
      content: tutorialDocument,
      orderIndex: 0,
    }),
  });
  
  log(`Response: ${response.status} ${response.statusText}`);
  
  const result = await response.json();
  
  if (response.status === 400) {
    const uuidError = result.error?.details?.find(d => 
      d.path === 'content.blocks.0.id' && d.message.includes('uuid')
    );
    
    if (uuidError) {
      log('\n✅ CONFIRMED: Got expected 400 "Invalid uuid" error');
      log('Error details:', result.error);
      return true;
    } else {
      log('\n⚠️  Got 400 but not UUID error:', result.error);
      return false;
    }
  } else if (!response.ok) {
    log(`\n⚠️  Got different error (${response.status}):`, result.error);
    return false;
  } else {
    log('\n❌ Unexpected: Server accepted invalid UUID!');
    return false;
  }
}

async function testWithProperUuid() {
  log('\n\nTEST 2: Using PROPER UUID (what the fix does)');
  log('=' .repeat(70));
  
  const goodBlockId = crypto.randomUUID();
  
  log(`\nGenerated block ID (NEW style): ${goodBlockId}`);
  log('Expected: UUID validation passes (may get different error)\n');
  
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
  
  const response = await fetch(`${BASE_URL}/api/tutorial-composer/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${adminToken}`,
    },
    body: JSON.stringify({
      subtopicId: JAVA_SUBTOPIC_ID,
      brandId: 'shared',
      content: tutorialDocument,
      orderIndex: 0,
    }),
  });
  
  log(`Response: ${response.status} ${response.statusText}`);
  
  const result = await response.json();
  
  if (response.status === 400) {
    const uuidError = result.error?.details?.find(d => 
      d.path === 'content.blocks.0.id' && d.message.includes('uuid')
    );
    
    if (uuidError) {
      log('\n❌ FAILED: Still getting UUID error with proper UUID!');
      log('Error details:', result.error);
      return false;
    } else {
      log('\n✅ UUID validation passed (got different 400 error):', result.error);
      return true;
    }
  } else if (!response.ok) {
    log(`\n✅ UUID validation passed (got ${response.status} error instead)`, result.error);
    return true;
  } else {
    log('\n✅ SUCCESS: Tutorial created with proper UUID!');
    log('Result:', { id: result.data?.id, status: result.data?.status });
    return true;
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  PROOF: Block ID is the root cause of 400 "Invalid uuid"    ║');
  console.log('║  Testing against DEPLOYED server: admin.skillhubcore.in      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  try {
    await login();
    
    const test1Result = await testWithOldStyleBlockId();
    const test2Result = await testWithProperUuid();
    
    console.log('\n' + '='.repeat(70));
    console.log('FINAL PROOF');
    console.log('='.repeat(70));
    console.log(`\nTest 1 (Bad UUID):  ${test1Result ? '✅ Got expected 400 error' : '❌ Unexpected result'}`);
    console.log(`Test 2 (Good UUID): ${test2Result ? '✅ UUID validation passed' : '❌ Still failing UUID'}`);
    
    if (test1Result && test2Result) {
      console.log('\n🎯 PROOF COMPLETE:');
      console.log('   ✅ Block ID with Date.now() string → 400 "Invalid uuid"');
      console.log('   ✅ Block ID with crypto.randomUUID() → UUID validation passes');
      console.log('\n   Root cause: Block ID must be a valid UUID');
      console.log('   Fix: Change to crypto.randomUUID() (commit ee6f812d)');
      console.log('\n   Deploy the fix to resolve the issue!');
    } else {
      console.log('\n⚠️  Unexpected results - investigate further');
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
