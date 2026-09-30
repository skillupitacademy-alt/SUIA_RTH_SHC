/**
 * GATE 2: CREATE TUTORIAL VIA REAL COMPOSER
 * 
 * Uses the production TutorialComposerService to create ONE active tutorial page:
 * 
 * Identity:
 *   subtopicId:        12efacf1-b5ad-4b43-9fe4-17ba1cf249e4 (existing MainDB)
 *   navigationNodeId:  what-is-java (existing sidebar)
 *   brandId:           shared
 * 
 * This proves the complete architecture:
 *   Composer → Validator → Repository → Database → Delivery
 */

import dotenv from 'dotenv';
import { getTutorialDb } from '@quiz/db-tutorial';
import { TutorialComposerService } from '@quiz/db-tutorial';

dotenv.config({ path: '.env.local' });

const SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'; // What is Java?
const NAVIGATION_NODE_ID = 'what-is-java';
const BRAND_ID = 'shared';

// Default TutorialDocument template for Phase 1
const defaultTutorialDocument = {
  version: '2.0',
  metadata: {
    title: 'What is Java?',
    description: 'Introduction to Java programming language',
    estimatedReadingTime: 10,
    difficulty: 'beginner',
    prerequisites: [],
    learningObjectives: [
      'Understand what Java is',
      'Learn Java\'s key features',
      'Know Java\'s ecosystem',
    ],
  },
  blocks: [
    {
      id: 'intro-1',
      type: 'objective',
      order: 0,
      content: {
        heading: 'Learning Objectives',
        text: 'By the end of this tutorial, you will understand what Java is, its key features, and why it is widely used in enterprise applications.',
      },
    },
    {
      id: 'definition-1',
      type: 'definition',
      order: 1,
      content: {
        heading: 'What is Java?',
        text: 'Java is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible. It is a general-purpose programming language intended to let programmers write once, run anywhere (WORA).',
        term: 'Java',
      },
    },
    {
      id: 'explanation-1',
      type: 'explanation',
      order: 2,
      content: {
        heading: 'Key Features of Java',
        text: 'Java is platform-independent, object-oriented, secure, robust, multithreaded, and portable. It runs on the Java Virtual Machine (JVM), which allows Java programs to run on any device that has the JVM installed.',
      },
    },
    {
      id: 'code-1',
      type: 'code',
      order: 3,
      content: {
        heading: 'Hello World in Java',
        language: 'java',
        code: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
        explanation: 'This is a simple Java program that prints "Hello, World!" to the console.',
      },
    },
    {
      id: 'summary-1',
      type: 'summary',
      order: 4,
      content: {
        heading: 'Summary',
        text: 'Java is a powerful, platform-independent programming language with a rich ecosystem. Its write-once-run-anywhere capability and robust features make it ideal for enterprise applications.',
        keyPoints: [
          'Platform-independent via JVM',
          'Object-oriented programming',
          'Rich standard library',
          'Strong community support',
        ],
      },
    },
  ],
};

console.log('═══════════════════════════════════════════════════════════');
console.log('GATE 2: CREATE TUTORIAL VIA REAL COMPOSER');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Target Identity:');
console.log(`  subtopicId:        ${SUBTOPIC_ID}`);
console.log(`  navigationNodeId:  ${NAVIGATION_NODE_ID}`);
console.log(`  brandId:           ${BRAND_ID}`);
console.log('');

const composer = new TutorialComposerService();

const mockContext = {
  userId: 'system-gate2-creation',
  brandId: BRAND_ID,
};

try {
  // Step 1: Create tutorial via Composer
  console.log('Step 1: Creating tutorial via TutorialComposerService...');
  
  const tutorial = await composer.createTutorial(
    {
      subtopicId: SUBTOPIC_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      brandId: BRAND_ID,
      content: defaultTutorialDocument,
      orderIndex: 0,
    },
    mockContext
  );

  console.log('✅ Tutorial created successfully!');
  console.log(`   ID: ${tutorial.id}`);
  console.log(`   Status: ${tutorial.status}`);
  console.log(`   Version: ${tutorial.version}`);
  console.log('');

  // Step 2: Publish the tutorial
  console.log('Step 2: Publishing tutorial...');
  
  const published = await composer.publishTutorial(tutorial.id, mockContext);
  
  console.log('✅ Tutorial published successfully!');
  console.log(`   Status: ${published.status}`);
  console.log(`   Published at: ${published.publishedAt}`);
  console.log('');

  // Step 3: Verify active record exists
  console.log('Step 3: Verifying active record...');
  
  const db = getTutorialDb();
  const verification = await db.query.tutorialSections.findFirst({
    where: (sections, { eq, and, isNull }) =>
      and(
        eq(sections.subtopicId, SUBTOPIC_ID),
        eq(sections.navigationNodeId, NAVIGATION_NODE_ID),
        eq(sections.brandId, BRAND_ID),
        isNull(sections.deletedAt)
      ),
  });

  if (verification) {
    console.log('✅ Active record verified!');
    console.log(`   ID: ${verification.id}`);
    console.log(`   subtopic_id: ${verification.subtopicId}`);
    console.log(`   navigation_node_id: ${verification.navigationNodeId}`);
    console.log(`   brand_id: ${verification.brandId}`);
    console.log(`   status: ${verification.status}`);
    console.log(`   deleted_at: ${verification.deletedAt}`);
    console.log('');
  } else {
    console.log('❌ Active record not found after creation!');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('GATE 2: COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ Real Composer workflow: PASS');
  console.log('✅ Tutorial creation: PASS');
  console.log('✅ Tutorial publication: PASS');
  console.log('✅ Active record exists: PASS');
  console.log('');
  console.log('Next: Run E2E certification');
  console.log('Command: node scripts/phase1-learner-e2e-certification.mjs');
  
} catch (error) {
  console.error('\n❌ GATE 2 FAILED:', error.message);
  console.error('\nStack:', error.stack);
  process.exit(1);
}
