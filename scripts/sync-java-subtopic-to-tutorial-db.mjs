#!/usr/bin/env node
/**
 * Sync Java subtopic from main DB to tutorial DB
 * Synchronizes hierarchy: domain → subject → topic → subtopic
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

// Load .env.local from workspace root
config({ path: resolve(process.cwd(), '.env.local') });

const MAIN_DB_URL = process.env.DATABASE_URL;
const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;
const JAVA_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

if (!MAIN_DB_URL || !TUTORIAL_DB_URL) {
  console.error('❌ Missing DATABASE_URL or DATABASE_URL_TUTORIAL in .env.local');
  process.exit(1);
}

console.log('Syncing Java subtopic to tutorial database...\n');

// Connect to main DB
const mainPool = new Pool({ connectionString: MAIN_DB_URL });
const mainDb = drizzle(mainPool);

// Connect to tutorial DB
const tutorialPool = new Pool({ connectionString: TUTORIAL_DB_URL });
const tutorialDb = drizzle(tutorialPool);

try {
  // 1. Get subtopic from main DB
  console.log('1. Fetching subtopic from main DB...');
  const subtopicResult = await mainDb.execute(`
    SELECT id, topic_id, name, slug
    FROM subtopics
    WHERE id = '${JAVA_SUBTOPIC_ID}'
  `);
  
  if (subtopicResult.rows.length === 0) {
    throw new Error(`Subtopic ${JAVA_SUBTOPIC_ID} not found in main DB`);
  }
  
  const subtopic = subtopicResult.rows[0];
  console.log('Found subtopic:', {
    id: subtopic.id,
    name: subtopic.name,
    slug: subtopic.slug,
  });
  
  // 2. Get topic info
  console.log('\n2. Fetching topic info...');
  const topicResult = await mainDb.execute(`
    SELECT id, subject_id, name, slug
    FROM topics
    WHERE id = '${subtopic.topic_id}'
  `);
  
  const topic = topicResult.rows[0];
  console.log('Found topic:', { name: topic.name });
  
  // 3. Check if topic exists in tutorial DB
  console.log('\n3. Checking tutorial_topics...');
  const tutorialTopicResult = await tutorialDb.execute(`
    SELECT id FROM tutorial_topics WHERE external_id = '${topic.id}'
  `);
  
  let tutorialTopicId;
  if (tutorialTopicResult.rows.length === 0) {
    // Need to sync topic first
    console.log('Topic not found in tutorial DB, syncing...');
    
    // Get subject
    const subjectResult = await mainDb.execute(`
      SELECT id, domain_id, name, slug
      FROM subjects
      WHERE id = '${topic.subject_id}'
    `);
    const subject = subjectResult.rows[0];
    
    // Get domain
    const domainResult = await mainDb.execute(`
      SELECT id, name, slug FROM domains WHERE id = '${subject.domain_id}'
    `);
    const domain = domainResult.rows[0];
    
    // Sync domain
    const tutorialDomainResult = await tutorialDb.execute(`
      INSERT INTO tutorial_domains (external_id, name, slug, created_at, updated_at)
      VALUES ('${domain.id}', '${domain.name}', '${domain.slug}', NOW(), NOW())
      ON CONFLICT (external_id) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const tutorialDomainId = tutorialDomainResult.rows[0].id;
    
    // Sync subject
    const tutorialSubjectResult = await tutorialDb.execute(`
      INSERT INTO tutorial_subjects (external_id, domain_id, name, slug, created_at, updated_at)
      VALUES ('${subject.id}', '${tutorialDomainId}', '${subject.name}', '${subject.slug}', NOW(), NOW())
      ON CONFLICT (external_id) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const tutorialSubjectId = tutorialSubjectResult.rows[0].id;
    
    // Sync topic
    const tutorialTopicInsertResult = await tutorialDb.execute(`
      INSERT INTO tutorial_topics (external_id, subject_id, name, slug, created_at, updated_at)
      VALUES ('${topic.id}', '${tutorialSubjectId}', '${topic.name}', '${topic.slug}', NOW(), NOW())
      ON CONFLICT (external_id) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    tutorialTopicId = tutorialTopicInsertResult.rows[0].id;
    console.log('✅ Topic synced');
  } else {
    tutorialTopicId = tutorialTopicResult.rows[0].id;
    console.log('✅ Topic already exists');
  }
  
  // 4. Sync subtopic
  console.log('\n4. Syncing subtopic to tutorial_subtopics...');
  const result = await tutorialDb.execute(`
    INSERT INTO tutorial_subtopics (external_id, topic_id, name, slug, difficulty_levels, created_at, updated_at)
    VALUES ('${subtopic.id}', '${tutorialTopicId}', '${subtopic.name}', '${subtopic.slug}', '[]', NOW(), NOW())
    ON CONFLICT (external_id) DO UPDATE 
    SET name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        updated_at = NOW()
    RETURNING id, external_id
  `);
  
  console.log('✅ Subtopic synced:', {
    internalId: result.rows[0].id,
    externalId: result.rows[0].external_id,
  });
  
  console.log('\n✅ Sync complete! You can now create tutorials for this subtopic.\n');
  
} catch (error) {
  console.error('\n❌ Sync failed:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  await mainPool.end();
  await tutorialPool.end();
}
