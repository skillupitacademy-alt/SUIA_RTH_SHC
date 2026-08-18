#!/usr/bin/env node
/**
 * Verify hierarchy IDs exist in SkillHubCore database
 * 
 * Checks:
 * - Domain ID exists
 * - Subject ID exists and belongs to domain
 * - Topic ID exists and belongs to subject  
 * - Subtopic ID exists and belongs to topic
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { 
  domains as shcDomains,
  subjects as shcSubjects,
  topics as shcTopics,
  subtopics as shcSubtopics,
} from '@quiz/db/schema/index.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Test values from the failed request
const TEST_IDS = {
  domainId: '30000000-0000-0000-0000-000000000001',
  subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e',
  topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',
  subtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',
};

const queryClient = postgres(DATABASE_URL);
const db = drizzle(queryClient);

console.log('🔍 Hierarchy ID Verification');
console.log('============================\n');

async function main() {
  try {
    // 1. CHECK DOMAIN
    console.log('1️⃣ Checking Domain...');
    const [domain] = await db
      .select()
      .from(shcDomains)
      .where(eq(shcDomains.id, TEST_IDS.domainId))
      .limit(1);
    
    if (domain) {
      console.log('  ✅ Domain found:', {
        id: domain.id,
        name: domain.name,
        deletedAt: domain.deletedAt,
      });
    } else {
      console.log(`  ❌ Domain NOT FOUND: ${TEST_IDS.domainId}`);
      console.log('     This is a FOREIGN KEY VIOLATION if FK still exists!');
      await queryClient.end();
      process.exit(1);
    }

    // 2. CHECK SUBJECT
    console.log('\n2️⃣ Checking Subject...');
    const [subject] = await db
      .select()
      .from(shcSubjects)
      .where(eq(shcSubjects.id, TEST_IDS.subjectId))
      .limit(1);
    
    if (subject) {
      console.log('  ✅ Subject found:', {
        id: subject.id,
        name: subject.name,
        domainId: subject.domainId,
        deletedAt: subject.deletedAt,
      });
      
      if (subject.domainId !== TEST_IDS.domainId) {
        console.log(`  ⚠️  WARNING: Subject belongs to different domain!`);
        console.log(`     Expected: ${TEST_IDS.domainId}`);
        console.log(`     Actual:   ${subject.domainId}`);
      }
    } else {
      console.log(`  ❌ Subject NOT FOUND: ${TEST_IDS.subjectId}`);
      console.log('     This is a FOREIGN KEY VIOLATION if FK still exists!');
      await queryClient.end();
      process.exit(1);
    }

    // 3. CHECK TOPIC
    console.log('\n3️⃣ Checking Topic...');
    const [topic] = await db
      .select()
      .from(shcTopics)
      .where(eq(shcTopics.id, TEST_IDS.topicId))
      .limit(1);
    
    if (topic) {
      console.log('  ✅ Topic found:', {
        id: topic.id,
        name: topic.name,
        subjectId: topic.subjectId,
        deletedAt: topic.deletedAt,
      });
      
      if (topic.subjectId !== TEST_IDS.subjectId) {
        console.log(`  ⚠️  WARNING: Topic belongs to different subject!`);
        console.log(`     Expected: ${TEST_IDS.subjectId}`);
        console.log(`     Actual:   ${topic.subjectId}`);
      }
    } else {
      console.log(`  ❌ Topic NOT FOUND: ${TEST_IDS.topicId}`);
      console.log('     This is a FOREIGN KEY VIOLATION if FK still exists!');
      await queryClient.end();
      process.exit(1);
    }

    // 4. CHECK SUBTOPIC
    console.log('\n4️⃣ Checking Subtopic...');
    const [subtopic] = await db
      .select()
      .from(shcSubtopics)
      .where(eq(shcSubtopics.id, TEST_IDS.subtopicId))
      .limit(1);
    
    if (subtopic) {
      console.log('  ✅ Subtopic found:', {
        id: subtopic.id,
        name: subtopic.name,
        topicId: subtopic.topicId,
        deletedAt: subtopic.deletedAt,
      });
      
      if (subtopic.topicId !== TEST_IDS.topicId) {
        console.log(`  ⚠️  WARNING: Subtopic belongs to different topic!`);
        console.log(`     Expected: ${TEST_IDS.topicId}`);
        console.log(`     Actual:   ${subtopic.topicId}`);
      }
    } else {
      console.log(`  ❌ Subtopic NOT FOUND: ${TEST_IDS.subtopicId}`);
      console.log('     This is a FOREIGN KEY VIOLATION if FK still exists!');
      await queryClient.end();
      process.exit(1);
    }

    // 5. VERIFY COMPLETE HIERARCHY
    console.log('\n5️⃣ Hierarchy Validation:');
    const hierarchyValid = 
      domain &&
      subject && subject.domainId === TEST_IDS.domainId &&
      topic && topic.subjectId === TEST_IDS.subjectId &&
      subtopic && subtopic.topicId === TEST_IDS.topicId;
    
    if (hierarchyValid) {
      console.log('  ✅ Complete hierarchy is valid:');
      console.log(`     ${domain.name}`);
      console.log(`     └─ ${subject.name}`);
      console.log(`        └─ ${topic.name}`);
      console.log(`           └─ ${subtopic.name}`);
    } else {
      console.log('  ❌ Hierarchy is BROKEN!');
    }

    await queryClient.end();
    console.log('\n✅ Verification complete');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error('\nError details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    await queryClient.end();
    process.exit(1);
  }
}

main();
