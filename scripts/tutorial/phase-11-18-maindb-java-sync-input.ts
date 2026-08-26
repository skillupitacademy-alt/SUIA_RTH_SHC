#!/usr/bin/env tsx
/**
 * PHASE 11.18: MainDB Java Sync Input Audit
 * READ ONLY - Verify MainDB hierarchy for Java topic
 */

import 'dotenv/config';
import { eq, isNull, and } from 'drizzle-orm';
import {
  domains as shcDomains,
  getDb,
  subjects as shcSubjects,
  subtopics as shcSubtopics,
  topics as shcTopics,
} from '@quiz/db';

const JAVA_TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

function section(title: string): void {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
  console.log('');
}

async function main() {
  console.log('PHASE 11.18 — MAINDB SYNC INPUT AUDIT');
  console.log('READ ONLY - NO DATABASE MODIFICATIONS');
  console.log('');
  console.log(`Target Topic ID: ${JAVA_TOPIC_ID}`);

  const db = getDb();

  section('STEP 1: QUERY TOPIC');
  
  const topicRows = await db.select().from(shcTopics).where(eq(shcTopics.id, JAVA_TOPIC_ID));
  
  if (topicRows.length === 0) {
    console.log('❌ FATAL: Topic not found');
    console.log('');
    console.log('CLASSIFICATION: MAINDB_SYNC_INPUT_INVALID');
    console.log('Missing: Topic');
    process.exit(1);
  }
  
  const topic = topicRows[0];
  console.log('✅ Topic found:');
  console.log(`   ID: ${topic.id}`);
  console.log(`   Name: ${topic.name}`);
  console.log(`   Subject ID: ${topic.subjectId}`);
  console.log(`   Deleted: ${topic.deletedAt ? 'YES (PROBLEM!)' : 'NO'}`);

  section('STEP 2: QUERY SUBJECT');
  
  const subjectRows = await db.select().from(shcSubjects).where(eq(shcSubjects.id, topic.subjectId));
  
  if (subjectRows.length === 0) {
    console.log('❌ FATAL: Subject not found');
    console.log(`   Expected ID: ${topic.subjectId}`);
    console.log('');
    console.log('CLASSIFICATION: MAINDB_SYNC_INPUT_INVALID');
    console.log('Missing: Subject');
    process.exit(1);
  }
  
  const subject = subjectRows[0];
  console.log('✅ Subject found:');
  console.log(`   ID: ${subject.id}`);
  console.log(`   Name: ${subject.name}`);
  console.log(`   Domain ID: ${subject.domainId}`);
  console.log(`   Deleted: ${subject.deletedAt ? 'YES (PROBLEM!)' : 'NO'}`);

  section('STEP 3: QUERY DOMAIN');
  
  const domainRows = await db.select().from(shcDomains).where(eq(shcDomains.id, subject.domainId));
  
  if (domainRows.length === 0) {
    console.log('❌ FATAL: Domain not found');
    console.log(`   Expected ID: ${subject.domainId}`);
    console.log('');
    console.log('CLASSIFICATION: MAINDB_SYNC_INPUT_INVALID');
    console.log('Missing: Domain');
    process.exit(1);
  }
  
  const domain = domainRows[0];
  console.log('✅ Domain found:');
  console.log(`   ID: ${domain.id}`);
  console.log(`   Name: ${domain.name}`);
  console.log(`   Deleted: ${domain.deletedAt ? 'YES (PROBLEM!)' : 'NO'}`);

  section('STEP 4: QUERY ACTIVE SUBTOPICS');
  
  const activeSubtopics = await db
    .select()
    .from(shcSubtopics)
    .where(and(
      eq(shcSubtopics.topicId, JAVA_TOPIC_ID),
      isNull(shcSubtopics.deletedAt)
    ));
  
  console.log(`Found ${activeSubtopics.length} active subtopics:`);
  
  if (activeSubtopics.length === 0) {
    console.log('⚠️  WARNING: No active subtopics found');
  }
  
  activeSubtopics.forEach((subtopic, idx) => {
    console.log(`   ${idx + 1}. ${subtopic.name} (${subtopic.id})`);
  });

  const whatIsJava = activeSubtopics.find(s => s.name === 'What is Java?');
  if (!whatIsJava) {
    console.log('');
    console.log('⚠️  WARNING: "What is Java?" subtopic not found');
  } else {
    console.log('');
    console.log('✅ "What is Java?" subtopic found');
    console.log(`   ID: ${whatIsJava.id}`);
    console.log(`   Topic ID match: ${whatIsJava.topicId === JAVA_TOPIC_ID ? 'YES' : 'NO (PROBLEM!)'}`);
  }

  section('STEP 5: VERIFY NULL CHECKS');
  
  const issues: string[] = [];
  
  if (!topic.id) issues.push('Topic ID is null');
  if (!topic.subjectId) issues.push('Topic subjectId is null');
  if (!subject.id) issues.push('Subject ID is null');
  if (!subject.domainId) issues.push('Subject domainId is null');
  if (!domain.id) issues.push('Domain ID is null');
  
  if (issues.length > 0) {
    console.log('❌ NULL IDENTIFIER ISSUES:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ All critical identifiers are non-null');
  }

  section('MAINDB HIERARCHY SUMMARY');
  
  console.log('Complete chain:');
  console.log('');
  console.log(`Domain:   ${domain.name}`);
  console.log(`          (${domain.id})`);
  console.log('          ↓');
  console.log(`Subject:  ${subject.name}`);
  console.log(`          (${subject.id})`);
  console.log('          ↓');
  console.log(`Topic:    ${topic.name}`);
  console.log(`          (${topic.id})`);
  console.log('          ↓');
  console.log(`Subtopics: ${activeSubtopics.length} active`);
  activeSubtopics.forEach(s => {
    console.log(`          - ${s.name} (${s.id})`);
  });

  section('CLASSIFICATION');
  
  const isValid = 
    topicRows.length > 0 &&
    subjectRows.length > 0 &&
    domainRows.length > 0 &&
    activeSubtopics.length > 0 &&
    whatIsJava !== undefined &&
    issues.length === 0;

  if (isValid) {
    console.log('MAINDB_SYNC_INPUT_VALID ✅');
    console.log('');
    console.log('All required entities exist with correct relationships.');
    console.log('ensureTopicHierarchySynced() should be able to sync this hierarchy.');
  } else {
    console.log('MAINDB_SYNC_INPUT_INVALID ❌');
    console.log('');
    console.log('Issues detected:');
    if (topicRows.length === 0) console.log('  - Topic missing');
    if (subjectRows.length === 0) console.log('  - Subject missing');
    if (domainRows.length === 0) console.log('  - Domain missing');
    if (activeSubtopics.length === 0) console.log('  - No active subtopics');
    if (!whatIsJava) console.log('  - "What is Java?" subtopic missing');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
}

main().catch(error => {
  console.error('');
  console.error('AUDIT FAILED');
  console.error(error);
  process.exit(1);
});
