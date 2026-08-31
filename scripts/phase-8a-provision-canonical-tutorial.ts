/**
 * Phase 8A - Provision Canonical "What is Java?" Tutorial
 * 
 * Creates a minimal published tutorial for browser E2E validation
 * 
 * Blocks:
 * - Definition D1
 * - Code C1
 * 
 * Identity:
 * - subtopicId: 12efacf1-b5ad-4b43-9fe4-17ba1cf249e4 (What is Java?)
 * - navigationNodeId: whatisjava
 * - brandId: shared
 */

import { db } from '../packages/db-tutorial/src/db';
import { tutorialSubtopics, tutorialSections } from '../packages/db-tutorial/src/schema';
import { tutorialComposerService } from '../packages/db-tutorial/src/index';
import { eq, and, isNull, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const CANONICAL_SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const CANONICAL_NAV_NODE_ID = 'whatisjava';
const CANONICAL_BRAND = 'shared';

const mockContext = {
  userId: 'phase-8a-provisioning-script',
  brandId: CANONICAL_BRAND,
};

async function main() {
  console.log('='.repeat(60));
  console.log('PHASE 8A - CANONICAL TUTORIAL PROVISIONING');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Verify subtopic exists
  console.log('Step 1: Verifying canonical subtopic...');
  const javaSubtopic = await db.query.tutorialSubtopics.findFirst({
    where: and(
      eq(tutorialSubtopics.name, 'What is Java?'),
      like(tutorialSubtopics.slug, 'what-is-java-%'),
      isNull(tutorialSubtopics.deletedAt)
    ),
  });

  if (!javaSubtopic) {
    console.error('❌ Canonical "What is Java?" subtopic not found');
    process.exit(1);
  }

  console.log(`✅ Found subtopic: ${javaSubtopic.name}`);
  console.log(`   External ID: ${javaSubtopic.externalId}`);
  console.log(`   Internal ID: ${javaSubtopic.id}`);
  console.log(`   Slug: ${javaSubtopic.slug}`);
  console.log();

  // Step 2: Check if tutorial already exists
  console.log('Step 2: Checking for existing tutorial...');
  const existingTutorial = await db.query.tutorialSections.findFirst({
    where: and(
      eq(tutorialSections.subtopicId, javaSubtopic.id),
      eq(tutorialSections.navigationNodeId, CANONICAL_NAV_NODE_ID),
      eq(tutorialSections.brandId, CANONICAL_BRAND)
    ),
  });

  if (existingTutorial) {
    console.log('⚠️  Tutorial already exists:');
    console.log(`   ID: ${existingTutorial.id}`);
    console.log(`   Status: ${existingTutorial.status}`);
    console.log(`   Published: ${existingTutorial.publishedAt || 'No'}`);
    console.log(`   Block count: ${existingTutorial.content?.blocks?.length || 0}`);
    console.log();
    console.log('Skipping creation. Use existing tutorial ID for Phase 8A validation.');
    return;
  }

  console.log('✅ No existing tutorial found. Creating new one...');
  console.log();

  // Step 3: Create Definition D1 block
  console.log('Step 3: Creating Definition D1 block...');
  const definitionId = randomUUID();
  const definitionBlock = {
    id: definitionId,
    type: 'definition',
    version: 'D1',
    content: {
      page: {
        type: 'definition',
        category: 'Java Fundamentals',
        title: 'What Is Java?',
        intro: 'Java is a popular programming language used for building applications across different platforms.',
        definition: 'Java is a high-level, class-based, object-oriented programming language designed to have minimal implementation dependencies.',
        explanation: [
          'Java code is compiled into bytecode that runs on the Java Virtual Machine (JVM).',
          'The JVM enables Java programs to run on any device with a compatible JVM installation.',
          'This "write once, run anywhere" capability makes Java highly portable.',
        ],
        example: {
          language: 'java',
          code: 'System.out.println("Hello, World!");',
        },
        characteristics: [
          {
            icon: '☕',
            title: 'Platform Independent',
            description: 'Java bytecode runs on any system with a JVM.',
          },
          {
            icon: '🔒',
            title: 'Object-Oriented',
            description: 'Java organizes code into reusable classes and objects.',
          },
          {
            icon: '🛡️',
            title: 'Secure',
            description: 'Java includes built-in security features and memory management.',
          },
        ],
        takeaway: 'Java enables developers to write portable, secure, object-oriented applications.',
      },
    },
  };

  console.log(`✅ Definition block created (ID: ${definitionId})`);
  console.log();

  // Step 4: Create Code C1 block
  console.log('Step 4: Creating Code C1 block...');
  const codeId = randomUUID();
  const codeBlock = {
    id: codeId,
    type: 'code',
    version: 'C1',
    content: {
      page: {
        type: 'code',
        title: 'Your First Java Program',
        introduction: 'Every Java program starts with a main method inside a class. Let\'s create a simple program that prints a message.',
        language: 'java',
        code: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
        explanation: [
          {
            focus: 'public class HelloWorld',
            description: 'Declares a public class named HelloWorld. The class name must match the filename.',
          },
          {
            focus: 'public static void main(String[] args)',
            description: 'The main method is the entry point of every Java application. It must have this exact signature.',
          },
          {
            focus: 'System.out.println',
            description: 'Prints text to the console followed by a newline.',
          },
        ],
        output: {
          value: 'Hello, World!',
          description: 'The program outputs this text when executed.',
        },
        takeaway: 'Every Java program needs a main method inside a class to run.',
      },
    },
  };

  console.log(`✅ Code block created (ID: ${codeId})`);
  console.log();

  // Step 5: Create tutorial document
  console.log('Step 5: Creating tutorial document...');
  const tutorialDocument = {
    schemaVersion: 1,
    blocks: [definitionBlock, codeBlock],
  };

  console.log(`✅ Tutorial document assembled (${tutorialDocument.blocks.length} blocks)`);
  console.log();

  // Step 6: Create tutorial via TutorialComposerService
  console.log('Step 6: Persisting tutorial via TutorialComposerService...');
  try {
    const createdTutorial = await tutorialComposerService.createTutorial(
      {
        subtopicId: javaSubtopic.externalId, // Use external ID
        navigationNodeId: CANONICAL_NAV_NODE_ID,
        brandId: CANONICAL_BRAND,
        content: tutorialDocument,
      },
      mockContext
    );

    console.log(`✅ Tutorial created successfully`);
    console.log(`   Tutorial ID: ${createdTutorial.id}`);
    console.log(`   Status: ${createdTutorial.status}`);
    console.log();

    // Step 7: Publish tutorial
    console.log('Step 7: Publishing tutorial...');
    const publishedTutorial = await tutorialComposerService.publishTutorial(
      createdTutorial.id,
      mockContext
    );

    console.log(`✅ Tutorial published successfully`);
    console.log(`   Status: ${publishedTutorial.status}`);
    console.log(`   Published At: ${publishedTutorial.publishedAt}`);
    console.log();

    // Step 8: Verify via database query
    console.log('Step 8: Database verification...');
    const verifyTutorial = await db.query.tutorialSections.findFirst({
      where: and(
        eq(tutorialSections.subtopicId, javaSubtopic.id),
        eq(tutorialSections.navigationNodeId, CANONICAL_NAV_NODE_ID),
        eq(tutorialSections.brandId, CANONICAL_BRAND)
      ),
    });

    if (!verifyTutorial) {
      console.error('❌ Tutorial not found in database after creation');
      process.exit(1);
    }

    console.log(`✅ Database verification passed`);
    console.log(`   Tutorial ID: ${verifyTutorial.id}`);
    console.log(`   Subtopic ID (internal): ${verifyTutorial.subtopicId}`);
    console.log(`   Navigation Node: ${verifyTutorial.navigationNodeId}`);
    console.log(`   Brand: ${verifyTutorial.brandId}`);
    console.log(`   Status: ${verifyTutorial.status}`);
    console.log(`   Published At: ${verifyTutorial.publishedAt}`);
    console.log(`   Block Count: ${verifyTutorial.content?.blocks?.length || 0}`);
    console.log();

    // Step 9: Display blocks
    console.log('Step 9: Tutorial content structure:');
    if (verifyTutorial.content?.blocks) {
      verifyTutorial.content.blocks.forEach((block, index) => {
        console.log(`   Block ${index + 1}:`);
        console.log(`     - ID: ${block.id}`);
        console.log(`     - Type: ${block.type}`);
        console.log(`     - Version: ${block.version}`);
      });
    }
    console.log();

    console.log('='.repeat(60));
    console.log('✅ PHASE 8A BACKEND FIXTURE: READY FOR GEMINI BROWSER E2E');
    console.log('='.repeat(60));
    console.log();
    console.log('Canonical Tutorial URL:');
    console.log('http://realtutorialhub.localhost:3003/learn/full-stack-development/backend-development/java/whatisjava');
    console.log();
    console.log('Delivery API Endpoint:');
    console.log(`GET /api/tutorial/sections/${CANONICAL_SUBTOPIC_EXTERNAL_ID}`);
    console.log('(with brand context: shared)');
    console.log();

  } catch (error) {
    console.error('❌ Error creating/publishing tutorial:');
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
