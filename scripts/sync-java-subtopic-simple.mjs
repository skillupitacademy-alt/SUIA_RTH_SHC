#!/usr/bin/env node
/**
 * Sync Java subtopic - Simple version using neon-serverless directly
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const mainSql = neon(process.env.DATABASE_URL);
const tutorialSql = neon(process.env.DATABASE_URL_TUTORIAL);
const JAVA_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

console.log('Syncing Java subtopic to tutorial database...\n');

try {
  // 1. Get subtopic from main DB
  console.log('1. Fetching subtopic from main DB...');
  const subtopics = await mainSql`
    SELECT id, topic_id, name
    FROM subtopics
    WHERE id = ${JAVA_SUBTOPIC_ID}
  `;
  
  if (subtopics.length === 0) {
    throw new Error(`Subtopic ${JAVA_SUBTOPIC_ID} not found`);
  }
  
  const subtopic = subtopics[0];
  console.log('✅ Found:', subtopic.name);
  
  // 2. Get topic
  console.log('\n2. Fetching topic...');
  const topics = await mainSql`
    SELECT id, subject_id, name
    FROM topics
    WHERE id = ${subtopic.topic_id}
  `;
  const topic = topics[0];
  console.log('✅ Found:', topic.name);
  
  // 3. Get subject
  console.log('\n3. Fetching subject...');
  const subjects = await mainSql`
    SELECT id, domain_id, name
    FROM subjects
    WHERE id = ${topic.subject_id}
  `;
  const subject = subjects[0];
  console.log('✅ Found:', subject.name);
  
  // 4. Get domain
  console.log('\n4. Fetching domain...');
  const domains = await mainSql`
    SELECT id, name
    FROM domains
    WHERE id = ${subject.domain_id}
  `;
  const domain = domains[0];
  console.log('✅ Found:', domain.name);
  
  // 5. Sync to tutorial DB
  console.log('\n5. Syncing to tutorial database...');
  
  // Sync domain
  const tutorialDomains = await tutorialSql`
    INSERT INTO tutorial_domains (external_id, name, slug, created_at, updated_at)
    VALUES (${domain.id}, ${domain.name}, ${domain.name.toLowerCase().replace(/\s+/g, '-')}, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE 
    SET external_id = EXCLUDED.external_id, name = EXCLUDED.name, updated_at = NOW()
    RETURNING id
  `;
  console.log('✅ Domain synced');
  
  // Sync subject
  const tutorialSubjects = await tutorialSql`
    INSERT INTO tutorial_subjects (external_id, domain_id, name, slug, created_at, updated_at)
    VALUES (${subject.id}, ${tutorialDomains[0].id}, ${subject.name}, ${subject.name.toLowerCase().replace(/\s+/g, '-')}, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE 
    SET external_id = EXCLUDED.external_id, name = EXCLUDED.name, updated_at = NOW()
    RETURNING id
  `;
  console.log('✅ Subject synced');
  
  // Sync topic
  const tutorialTopics = await tutorialSql`
    INSERT INTO tutorial_topics (external_id, subject_id, name, slug, created_at, updated_at)
    VALUES (${topic.id}, ${tutorialSubjects[0].id}, ${topic.name}, ${topic.name.toLowerCase().replace(/\s+/g, '-')}, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE 
    SET external_id = EXCLUDED.external_id, name = EXCLUDED.name, updated_at = NOW()
    RETURNING id
  `;
  console.log('✅ Topic synced');
  
  // Sync subtopic
  const tutorialSubtopics = await tutorialSql`
    INSERT INTO tutorial_subtopics (external_id, topic_id, name, slug, difficulty_levels, created_at, updated_at)
    VALUES (${subtopic.id}, ${tutorialTopics[0].id}, ${subtopic.name}, ${subtopic.name.toLowerCase().replace(/\s+/g, '-')}, '[]'::jsonb, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE 
    SET external_id = EXCLUDED.external_id, name = EXCLUDED.name, updated_at = NOW()
    RETURNING id, external_id
  `;
  console.log('✅ Subtopic synced');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ SYNC COMPLETE');
  console.log('='.repeat(60));
  console.log('\nMapping:');
  console.log(`External ID (main DB):  ${tutorialSubtopics[0].external_id}`);
  console.log(`Internal ID (tutorial): ${tutorialSubtopics[0].id}`);
  console.log('\nYou can now create tutorials for this subtopic!\n');
  
} catch (error) {
  console.error('\n❌ Sync failed:', error.message);
  process.exit(1);
}
