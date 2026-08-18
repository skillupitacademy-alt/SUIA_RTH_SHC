#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';

const QUIZ_DB = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require&channel_binding=require";

const TEST_IDS = {
  domainId: '30000000-0000-0000-0000-000000000001',
  subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e',
  topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',
  subtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',
};

const httpClient = neon(QUIZ_DB);

console.log('🔍 Checking Hierarchy IDs in SkillHubCore Database');
console.log('==================================================\n');

try {
  // Check domain
  console.log('1️⃣ Domain...');
  const domain = await httpClient`SELECT id, name, deleted_at FROM domains WHERE id = ${TEST_IDS.domainId}`;
  if (domain.length > 0) {
    console.log('  ✅', domain[0]);
  } else {
    console.log('  ❌ NOT FOUND');
  }

  // Check subject
  console.log('\n2️⃣ Subject...');
  const subject = await httpClient`SELECT id, name, domain_id, deleted_at FROM subjects WHERE id = ${TEST_IDS.subjectId}`;
  if (subject.length > 0) {
    console.log('  ✅', subject[0]);
  } else {
    console.log('  ❌ NOT FOUND');
  }

  // Check topic
  console.log('\n3️⃣ Topic...');
  const topic = await httpClient`SELECT id, name, subject_id, deleted_at FROM topics WHERE id = ${TEST_IDS.topicId}`;
  if (topic.length > 0) {
    console.log('  ✅', topic[0]);
  } else {
    console.log('  ❌ NOT FOUND');
  }

  // Check subtopic
  console.log('\n4️⃣ Subtopic...');
  const subtopic = await httpClient`SELECT id, name, topic_id, deleted_at FROM subtopics WHERE id = ${TEST_IDS.subtopicId}`;
  if (subtopic.length > 0) {
    console.log('  ✅', subtopic[0]);
  } else {
    console.log('  ❌ NOT FOUND');
  }

  console.log('\n✅ Done');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
