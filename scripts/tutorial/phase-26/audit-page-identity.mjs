#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 2.6 — UNIVERSAL PAGE IDENTITY AUDIT
 * ============================================================
 *
 * Audits:
 *
 * Curriculum DB
 *   domain
 *   subject
 *   topic
 *   subtopic
 *
 * Tutorial DB
 *   tutorial_subtopics
 *   tutorial_sections
 *
 * Verifies:
 *
 * curriculum subtopic.id
 *        === tutorial_subtopics.external_id
 *
 * tutorial_subtopics.id
 *        === tutorial_sections.subtopic_id
 *
 * tutorial_sections.navigation_node_id
 *        === requested navigationNodeId
 *
 * Never modifies data.
 */

import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const CURRICULUM_URL = process.env.DATABASE_URL;
const TUTORIAL_URL = process.env.DATABASE_URL_TUTORIAL;

if (!CURRICULUM_URL) {
  throw new Error('DATABASE_URL is missing');
}

if (!TUTORIAL_URL) {
  throw new Error('DATABASE_URL_TUTORIAL is missing');
}

const curriculumDb = new Client({ connectionString: CURRICULUM_URL });
const tutorialDb = new Client({ connectionString: TUTORIAL_URL });

const TEST = {
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  curriculumSubtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',
  tutorialSubtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
  tutorialSubtopicSlug: 'what-is-java-12efacf1',
  navigationNodeId: 'whatisjava',
  sectionId: '5326eeb6-c4c8-4218-9687-2b46f94a9bb4',
};

function heading(title) {
  console.log('');
  console.log('='.repeat(78));
  console.log(title);
  console.log('='.repeat(78));
}

function pass(message, data = {}) {
  console.log(`✅ ${message}`, data);
}

function fail(message, data = {}) {
  console.error(`❌ ${message}`, data);
}

async function main() {
  heading('PHASE 2.6 — UNIVERSAL PAGE IDENTITY AUDIT');

  await curriculumDb.connect();
  await tutorialDb.connect();

  pass('Database connections established');

  // ----------------------------------------------------------
  // 1. Curriculum hierarchy
  // ----------------------------------------------------------

  heading('1. CURRICULUM HIERARCHY');

  const subtopicResult = await curriculumDb.query(
    `
      SELECT
        id,
        name,
        topic_id,
        deleted_at
      FROM subtopics
      WHERE id = $1
      LIMIT 1
      `,
    [TEST.curriculumSubtopicId]
  );

  if (subtopicResult.rows.length === 0) {
    fail('Curriculum subtopic does not exist');
    process.exitCode = 1;
    return;
  }

  const curriculumSubtopic = subtopicResult.rows[0];

  pass('Curriculum subtopic exists', curriculumSubtopic);

  // ----------------------------------------------------------
  // 2. Tutorial subtopic mapping
  // ----------------------------------------------------------

  heading('2. TUTORIAL SUBTOPIC MAPPING');

  const tutorialSubtopicResult = await tutorialDb.query(
    `
      SELECT
        id,
        external_id,
        name,
        slug,
        topic_id,
        deleted_at
      FROM tutorial_subtopics
      WHERE external_id = $1
      LIMIT 1
      `,
    [TEST.curriculumSubtopicId]
  );

  if (tutorialSubtopicResult.rows.length === 0) {
    fail('TutorialDB mapping missing');
    process.exitCode = 1;
    return;
  }

  const tutorialSubtopic = tutorialSubtopicResult.rows[0];

  pass('TutorialDB mapping exists', tutorialSubtopic);

  // ----------------------------------------------------------
  // 3. Identity invariant
  // ----------------------------------------------------------

  heading('3. CROSS-DATABASE IDENTITY INVARIANT');

  if (tutorialSubtopic.external_id !== curriculumSubtopic.id) {
    fail('external_id invariant FAILED', {
      curriculum: curriculumSubtopic.id,
      externalId: tutorialSubtopic.external_id,
    });
    process.exitCode = 1;
  } else {
    pass('tutorial_subtopics.external_id === curriculum subtopics.id');
  }

  if (tutorialSubtopic.id !== TEST.tutorialSubtopicId) {
    fail('TutorialDB internal ID mismatch', {
      expected: TEST.tutorialSubtopicId,
      actual: tutorialSubtopic.id,
    });
    process.exitCode = 1;
  } else {
    pass('TutorialDB internal subtopic ID matches expected');
  }

  if (tutorialSubtopic.slug !== TEST.tutorialSubtopicSlug) {
    fail('Canonical slug mismatch', {
      expected: TEST.tutorialSubtopicSlug,
      actual: tutorialSubtopic.slug,
    });
    process.exitCode = 1;
  } else {
    pass('Canonical TutorialDB slug is correct');
  }

  // ----------------------------------------------------------
  // 4. Section
  // ----------------------------------------------------------

  heading('4. TUTORIAL SECTION');

  const sectionResult = await tutorialDb.query(
    `
      SELECT
        ts.id,
        ts.subtopic_id,
        ts.navigation_node_id,
        ts.brand_id,
        ts.status,
        ts.version,
        ts.published_at,
        ts.deleted_at,
        jsonb_typeof(ts.content::jsonb) AS content_type,
        jsonb_array_length(
          COALESCE(
            ts.content::jsonb -> 'blocks',
            '[]'::jsonb
          )
        ) AS block_count
      FROM tutorial_sections ts
      WHERE ts.id = $1
      LIMIT 1
      `,
    [TEST.sectionId]
  );

  if (sectionResult.rows.length === 0) {
    fail('Tutorial section does not exist');
    process.exitCode = 1;
    return;
  }

  const section = sectionResult.rows[0];

  pass('Tutorial section exists', section);

  // ----------------------------------------------------------
  // 5. Section → subtopic invariant
  // ----------------------------------------------------------

  heading('5. SECTION → TUTORIAL SUBTOPIC INVARIANT');

  if (section.subtopic_id !== tutorialSubtopic.id) {
    fail('tutorial_sections.subtopic_id invariant FAILED', {
      expected: tutorialSubtopic.id,
      actual: section.subtopic_id,
    });
    process.exitCode = 1;
  } else {
    pass('tutorial_sections.subtopic_id === tutorial_subtopics.id');
  }

  // ----------------------------------------------------------
  // 6. Navigation node invariant
  // ----------------------------------------------------------

  heading('6. NAVIGATION NODE IDENTITY');

  if (section.navigation_node_id !== TEST.navigationNodeId) {
    fail('navigationNodeId invariant FAILED', {
      expected: TEST.navigationNodeId,
      actual: section.navigation_node_id,
    });
    process.exitCode = 1;
  } else {
    pass('navigationNodeId matches tutorial section');
  }

  // ----------------------------------------------------------
  // 7. Publication
  // ----------------------------------------------------------

  heading('7. PUBLICATION STATE');

  const published = ['approved', 'deployed'].includes(section.status);

  if (!published) {
    fail('Tutorial section is not learner-published', {
      status: section.status,
    });
    process.exitCode = 1;
  } else {
    pass('Tutorial section is published', {
      status: section.status,
    });
  }

  // ----------------------------------------------------------
  // 8. Content
  // ----------------------------------------------------------

  heading('8. TUTORIAL DOCUMENT');

  if (section.content_type !== 'object') {
    fail('Tutorial content is not JSON object');
    process.exitCode = 1;
  }

  pass('Block count', {
    blocks: Number(section.block_count),
  });

  // ----------------------------------------------------------
  // Final
  // ----------------------------------------------------------

  heading('FINAL PHASE 2.6 IDENTITY RESULT');

  if (process.exitCode === 1) {
    console.error('❌ IDENTITY AUDIT FAILED');
  } else {
    console.log('✅ IDENTITY AUDIT PASSED');
    console.log('');
    console.log('Curriculum Subtopic:', curriculumSubtopic.id);
    console.log('Tutorial Subtopic:', tutorialSubtopic.id);
    console.log('Canonical Slug:', tutorialSubtopic.slug);
    console.log('Navigation Node:', section.navigation_node_id);
    console.log('Section:', section.id);
    console.log('Blocks:', section.block_count);
  }
}

try {
  await main();
} catch (error) {
  console.error('');
  console.error('❌ AUDIT CRASHED');
  console.error(error);
  process.exitCode = 1;
} finally {
  await curriculumDb.end().catch(() => {});
  await tutorialDb.end().catch(() => {});
}
