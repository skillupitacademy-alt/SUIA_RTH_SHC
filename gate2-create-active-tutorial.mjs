/**
 * GATE 2: CREATE ACTIVE TUTORIAL RECORD
 * 
 * Creates ONE active tutorial_sections record using the same identity the
 * Composer Service would use:
 * 
 * Identity: (subtopicId, navigationNodeId, brandId)
 *   subtopicId:        12efacf1-b5ad-4b43-9fe4-17ba1cf249e4 
 *   navigationNodeId:  what-is-java
 *   brandId:           shared
 * 
 * This record will be in 'published' status so E2E delivery can find it.
 */

import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const SUBTOPIC_ID = '7a7a0647-2207-485d-8e93-fed68c3155bd'; // TutorialDB What is Java?
const NAVIGATION_NODE_ID = 'what-is-java';
const BRAND_ID = 'shared';

// Phase 1 TutorialDocument with CURRENT schema-compliant structure
const tutorialDocument = {
  schemaVersion: 1,
  blocks: [
    // Callout block (replaces old 'objective')
    {
      id: crypto.randomUUID(),
      type: 'callout',
      content: {
        variant: 'info',
        title: 'Learning Objectives',
        text: 'By the end of this tutorial, you will understand what Java is, its key features, and why it is widely used in enterprise applications.',
      },
      presentation: { layout: 'default', emphasis: 'normal' },
    },
    // Definition D1 block (current versioned architecture)
    {
      id: crypto.randomUUID(),
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Programming Language',
          title: 'What is Java?',
          intro: 'Java is a cornerstone of modern software development, powering everything from mobile apps to enterprise systems.',
          definition: 'Java is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible. It is a general-purpose programming language intended to let programmers write once, run anywhere (WORA), meaning that compiled Java code can run on all platforms that support Java without the need for recompilation.',
          explanation: [
            'Java was originally developed by James Gosling at Sun Microsystems (later acquired by Oracle) and released in 1995.',
            'The language derives much of its syntax from C and C++, but has fewer low-level facilities than either of them.',
            'Java applications are typically compiled to bytecode that can run on any Java virtual machine (JVM) regardless of the underlying computer architecture.',
          ],
          example: {
            language: 'java',
            code: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
          },
          characteristics: [
            {
              icon: '🌐',
              title: 'Platform Independent',
              description: 'Write once, run anywhere - Java bytecode runs on any platform with a JVM.',
            },
            {
              icon: '🔒',
              title: 'Secure',
              description: 'Built-in security features protect against malicious code and unauthorized access.',
            },
            {
              icon: '⚡',
              title: 'Robust',
              description: 'Strong memory management and exception handling ensure reliable applications.',
            },
          ],
          takeaway: 'Java is a powerful, platform-independent programming language with a rich ecosystem, making it ideal for enterprise applications.',
        },
      },
    },
    // Code C1 block (current versioned architecture)
    {
      id: crypto.randomUUID(),
      type: 'code',
      version: 'C1',
      content: {
        page: {
          type: 'code',
          title: 'Understanding the HelloWorld Program',
          introduction: 'Let\'s break down the classic HelloWorld program to understand Java\'s basic structure and syntax.',
          language: 'java',
          code: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
          filename: 'HelloWorld.java',
          explanation: [
            {
              focus: 'public class HelloWorld',
              description: 'Declares a public class named HelloWorld. The class name must match the filename.',
            },
            {
              focus: 'public static void main(String[] args)',
              description: 'The main method is the entry point of every Java application. It must be public, static, and void.',
            },
            {
              focus: 'System.out.println()',
              description: 'Prints text to the console followed by a newline. System.out is the standard output stream.',
            },
          ],
          output: {
            value: 'Hello, World!',
            description: 'The program outputs this text to the console when executed.',
          },
          takeaway: 'Every Java program must have a main method that serves as the entry point.',
          practiceHint: 'Try modifying the message inside println() to print your own text.',
        },
      },
    },
    // Summary block (simple current schema)
    {
      id: crypto.randomUUID(),
      type: 'summary',
      content: {
        title: 'Key Takeaways',
        points: [
          'Java is a platform-independent programming language that runs on the JVM',
          'Java is object-oriented, secure, and robust',
          'The "write once, run anywhere" capability makes Java ideal for cross-platform development',
          'Java has a rich standard library and strong community support',
          'Every Java program requires a main method as its entry point',
        ],
      },
      presentation: { layout: 'default', emphasis: 'normal' },
    },
  ],
  metadata: {
    estimatedReadTime: 10,
    learningObjectives: [
      'Understand what Java is and its core philosophy',
      'Learn Java\'s key features and characteristics',
      'Write and understand a basic Java program',
    ],
    tags: ['java', 'programming', 'introduction', 'beginner'],
    audience: 'beginner',
  },
};

console.log('═══════════════════════════════════════════════════════════');
console.log('GATE 2: CREATE ACTIVE TUTORIAL RECORD');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Target Identity:');
console.log(`  subtopicId:        ${SUBTOPIC_ID}`);
console.log(`  navigationNodeId:  ${NAVIGATION_NODE_ID}`);
console.log(`  brandId:           ${BRAND_ID}`);
console.log('');

try {
  // Step 1: Check for existing active record and DELETE if found (PHASE 9 repair)
  console.log('Step 1: Checking for existing active record...');
  
  const existing = await tutorialDb.query(`
    SELECT id, status, deleted_at, content->'schemaVersion' as schema_version
    FROM tutorial_sections
    WHERE subtopic_id = $1
      AND navigation_node_id = $2
      AND brand_id = $3
      AND deleted_at IS NULL
  `, [SUBTOPIC_ID, NAVIGATION_NODE_ID, BRAND_ID]);

  if (existing.rows.length > 0) {
    console.log('⚠️  Active record exists. Checking schemaVersion...');
    console.log(`   ID: ${existing.rows[0].id}`);
    console.log(`   Status: ${existing.rows[0].status}`);
    console.log(`   schemaVersion: ${existing.rows[0].schema_version}`);
    
    if (existing.rows[0].schema_version === null || existing.rows[0].schema_version === undefined) {
      console.log('❌ Existing record has invalid schemaVersion. DELETING for PHASE 9 repair...');
      await tutorialDb.query(`DELETE FROM tutorial_sections WHERE id = $1`, [existing.rows[0].id]);
      console.log('✅ Malformed record deleted. Will create new valid record.\n');
    } else {
      console.log('✅ Record already has valid schemaVersion. Skipping creation.');
      await tutorialDb.end();
      process.exit(0);
    }
  } else {
    console.log('No active record found. Creating new record...\n');
  }

  // Step 2: Insert new active record
  console.log('Step 2: Creating tutorial_sections record...');
  
  const now = new Date();
  const tutorialId = randomUUID();
  
  const result = await tutorialDb.query(`
    INSERT INTO tutorial_sections (
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      order_index,
      content,
      version,
      language,
      status,
      generated_by_ai,
      regeneration_count,
      brand_visibility,
      created_at,
      updated_at,
      published_at,
      deleted_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
    RETURNING id, status, published_at
  `, [
    tutorialId,
    SUBTOPIC_ID,
    NAVIGATION_NODE_ID,
    BRAND_ID,
    0, // order_index
    JSON.stringify(tutorialDocument),
    1, // version
    'en', // language
    'deployed', // status - CRITICAL: must be deployed for delivery
    false, // generated_by_ai
    0, // regeneration_count
    'shared_visible', // brand_visibility
    now, // created_at
    now, // updated_at
    now, // published_at
    null, // deleted_at - NULL means active
  ]);

  console.log('✅ Tutorial record created successfully!');
  console.log(`   ID: ${result.rows[0].id}`);
  console.log(`   Status: ${result.rows[0].status}`);
  console.log(`   Published at: ${result.rows[0].published_at}`);
  console.log('');

  // Step 3: Verify the record can be queried with E2E conditions
  console.log('Step 3: Verifying E2E query conditions...');
  
  const verification = await tutorialDb.query(`
    SELECT 
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      status,
      deleted_at
    FROM tutorial_sections
    WHERE subtopic_id = $1
      AND navigation_node_id = $2
      AND brand_id = $3
      AND deleted_at IS NULL
      AND status = 'deployed'
  `, [SUBTOPIC_ID, NAVIGATION_NODE_ID, BRAND_ID]);

  if (verification.rows.length === 1) {
    console.log('✅ Record verified with E2E query conditions!');
    console.log(`   subtopic_id:        ${verification.rows[0].subtopic_id}`);
    console.log(`   navigation_node_id: ${verification.rows[0].navigation_node_id}`);
    console.log(`   brand_id:           ${verification.rows[0].brand_id}`);
    console.log(`   status:             ${verification.rows[0].status}`);
    console.log(`   deleted_at:         ${verification.rows[0].deleted_at}`);
    console.log('');
  } else {
    console.log(`❌ Verification failed! Found ${verification.rows.length} records`);
    await tutorialDb.end();
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('GATE 2: COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ Active tutorial record exists');
  console.log('✅ Identity: (subtopicId, navigationNodeId, brandId)');
  console.log('✅ Status: deployed');
  console.log('✅ deleted_at: NULL');
  console.log('');
  console.log('Next: Run E2E certification');
  console.log('Command: node scripts/phase1-learner-e2e-certification.mjs');

} catch (error) {
  console.error('\n❌ GATE 2 FAILED:', error.message);
  console.error('\nStack:', error.stack);
  process.exit(1);
} finally {
  await tutorialDb.end();
}
