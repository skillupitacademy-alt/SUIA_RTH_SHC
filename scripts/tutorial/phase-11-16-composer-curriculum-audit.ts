#!/usr/bin/env tsx
/**
 * PHASE 11.16: Navigation Composer Curriculum Audit
 * READ ONLY - NO DATABASE MODIFICATIONS
 * 
 * Purpose: Investigate MainDB vs TutorialDB curriculum before using Frontend Composer
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db as tutorialDb } from '@quiz/db-tutorial';
import { getDb } from '@quiz/db';

type Row = Record<string, unknown>;

function section(title: string): void {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
  console.log('');
}

function printRows(rows: Row[]): void {
  if (rows.length === 0) {
    console.log('  No rows found.');
    return;
  }

  for (const row of rows) {
    console.log(JSON.stringify(row, null, 2));
  }
}

async function inspectMainDb(): Promise<void> {
  section('MAINDB — FULL STACK DEVELOPMENT');

  const mainDb = getDb();
  
  const domains = await mainDb.execute(sql`
    SELECT
      id,
      name
    FROM domains
    WHERE deleted_at IS NULL
      AND name ILIKE '%Full Stack Development%'
    ORDER BY name
  `);

  console.log('Domains:');
  printRows(domains.rows as Row[]);

  const domain = domains.rows[0] as
    | {
        id: string;
        name: string;
      }
    | undefined;

  if (!domain) {
    console.log('\nMainDB Full Stack Development not found.');
    return;
  }

  console.log(`\nMainDB domain ID: ${domain.id}`);

  const subjects = await mainDb.execute(sql`
    SELECT
      id,
      name,
      domain_id
    FROM subjects
    WHERE domain_id = ${domain.id}
      AND deleted_at IS NULL
    ORDER BY name
  `);

  section('MAINDB — SUBJECTS UNDER FULL STACK DEVELOPMENT');

  printRows(subjects.rows as Row[]);

  const backend = subjects.rows.find(
    (row: any) =>
      String(row.name).toLowerCase().includes('backend'),
  );

  const frontend = subjects.rows.find(
    (row: any) =>
      String(row.name).toLowerCase().includes('front') ||
      String(row.name).toLowerCase().includes('frontend'),
  );

  console.log('');
  console.log(
    `Backend Development: ${
      backend ? 'FOUND' : 'NOT FOUND'
    }`,
  );

  console.log(
    `Front End Development: ${
      frontend ? 'FOUND' : 'NOT FOUND'
    }`,
  );

  for (const subject of subjects.rows as any[]) {
    const topics = await mainDb.execute(sql`
      SELECT
        id,
        name,
        subject_id
      FROM topics
      WHERE subject_id = ${subject.id}
        AND deleted_at IS NULL
      ORDER BY name
    `);

    console.log('');
    console.log(
      `Topics under subject: ${subject.name}`,
    );

    printRows(topics.rows as Row[]);

    for (const topic of topics.rows as any[]) {
      if (
        String(topic.name).toLowerCase().includes('java')
      ) {
        const subtopics = await mainDb.execute(sql`
          SELECT
            id,
            name,
            topic_id
          FROM subtopics
          WHERE topic_id = ${topic.id}
            AND deleted_at IS NULL
          ORDER BY name
        `);

        console.log('');
        console.log(
          `JAVA SUBTOPICS UNDER ${topic.name}:`,
        );

        printRows(subtopics.rows as Row[]);
      }
    }
  }
}

async function inspectTutorialDb(): Promise<void> {
  section('TUTORIALDB — JAVA CURRICULUM');

  const rows = await tutorialDb.execute(sql`
    SELECT
      d.id AS domain_id,
      d.external_id AS domain_external_id,
      d.name AS domain_name,
      d.slug AS domain_slug,

      s.id AS subject_id,
      s.external_id AS subject_external_id,
      s.name AS subject_name,
      s.slug AS subject_slug,

      t.id AS topic_id,
      t.external_id AS topic_external_id,
      t.name AS topic_name,
      t.slug AS topic_slug,

      st.id AS subtopic_id,
      st.external_id AS subtopic_external_id,
      st.name AS subtopic_name,
      st.slug AS subtopic_slug

    FROM tutorial_subtopics st

    JOIN tutorial_topics t
      ON t.id = st.topic_id

    JOIN tutorial_subjects s
      ON s.id = t.subject_id

    JOIN tutorial_domains d
      ON d.id = s.domain_id

    WHERE
      t.name ILIKE '%java%'
      OR t.slug ILIKE '%java%'
      OR st.name ILIKE '%java%'
      OR st.slug ILIKE '%java%'

    ORDER BY
      d.name,
      s.name,
      t.name,
      st.name
  `);

  printRows(rows.rows as Row[]);
}

async function inspectSidebar(): Promise<void> {
  section('TUTORIALDB — JAVA SIDEBAR');

  const rows = await tutorialDb.execute(sql`
    SELECT
      id,
      brand_id,
      domain_id,
      subject_id,
      topic_id,
      active_subtopic_id,
      status,
      version,
      published_at,
      created_at,
      updated_at
    FROM tutorial_sidebar_trees_v2
    WHERE topic_id IN (
      SELECT id
      FROM tutorial_topics
      WHERE name ILIKE '%java%'
         OR slug ILIKE '%java%'
    )
    ORDER BY updated_at DESC
  `);

  printRows(rows.rows as Row[]);
}

async function inspectSections(): Promise<void> {
  section('TUTORIALDB — JAVA TUTORIAL SECTIONS');

  const rows = await tutorialDb.execute(sql`
    SELECT
      ts.id,
      ts.subtopic_id,
      ts.navigation_node_id,
      ts.brand_id,
      ts.brand_visibility,
      ts.status,
      ts.version,
      ts.language,
      ts.published_at,
      ts.deleted_at

    FROM tutorial_sections ts

    JOIN tutorial_subtopics st
      ON st.id = ts.subtopic_id

    WHERE
      st.slug = 'whatisjava'
      AND ts.deleted_at IS NULL

    ORDER BY
      ts.version DESC,
      ts.created_at DESC
  `);

  printRows(rows.rows as Row[]);
}

async function main(): Promise<void> {
  console.log('');
  console.log(
    'PHASE 11.16 — NAVIGATION COMPOSER CURRICULUM AUDIT',
  );
  console.log(
    'READ ONLY — NO DATABASE MODIFICATIONS',
  );

  await inspectMainDb();
  await inspectTutorialDb();
  await inspectSidebar();
  await inspectSections();

  section('AUDIT COMPLETE');

  console.log(
    'No INSERT, UPDATE, DELETE, migration, or publish operation was performed.',
  );
}

main().catch((error) => {
  console.error('');
  console.error('AUDIT FAILED');
  console.error('');
  console.error(error);
  process.exit(1);
});
