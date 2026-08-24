#!/usr/bin/env node

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

async function resetWhatIsJavaSubtopics() {
  const client = await pool.connect();

  try {
    console.log(`
══════════════════════════════════════════════════════════════════
PHASE 1 — RESET "WHAT IS JAVA?" SUBTOPIC RECORDS
══════════════════════════════════════════════════════════════════
`);

    await client.query('BEGIN');

    // ------------------------------------------------------------
    // STEP 1 — Find the exact records
    // ------------------------------------------------------------

    const records = await client.query(`
      SELECT
        ts.id,
        ts.external_id,
        ts.name,
        ts.slug,
        ts.topic_id,
        ts.created_at,
        ts.updated_at
      FROM tutorial_subtopics ts
      WHERE LOWER(ts.name) = LOWER('What is Java?')
      ORDER BY ts.created_at
    `);

    console.log(`[STEP 1] Found ${records.rows.length} record(s)\n`);

    console.table(records.rows);

    if (records.rows.length !== 2) {
      throw new Error(
        `Expected exactly 2 "What is Java?" records, found ${records.rows.length}. Aborting.`
      );
    }

    // ------------------------------------------------------------
    // STEP 2 — Check references
    // ------------------------------------------------------------

    console.log('\n[STEP 2] Checking dependent records...\n');

    for (const row of records.rows) {
      console.log(`Checking subtopic: ${row.id}`);
      console.log(`  slug: ${row.slug}`);

      const sections = await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM tutorial_sections
        WHERE subtopic_id = $1
        `,
        [row.id]
      );

      console.log(
        `  tutorial_sections: ${sections.rows[0].count}`
      );

      // Add other dependent-table checks here if your schema
      // contains direct FK references to tutorial_subtopics.
    }

    // ------------------------------------------------------------
    // STEP 3 — Delete tutorial content first
    // ------------------------------------------------------------

    console.log('\n[STEP 3] Removing any tutorial content...\n');

    const sectionDelete = await client.query(`
      DELETE FROM tutorial_sections
      WHERE subtopic_id IN (
        SELECT id
        FROM tutorial_subtopics
        WHERE LOWER(name) = LOWER('What is Java?')
      )
    `);

    console.log(
      `  tutorial_sections deleted: ${sectionDelete.rowCount}`
    );

    // ------------------------------------------------------------
    // STEP 4 — Delete the two subtopic records
    // ------------------------------------------------------------

    console.log('\n[STEP 4] Deleting the two subtopic records...\n');

    const deleted = await client.query(`
      DELETE FROM tutorial_subtopics
      WHERE LOWER(name) = LOWER('What is Java?')
      RETURNING
        id,
        external_id,
        name,
        slug,
        topic_id
    `);

    console.table(deleted.rows);

    if (deleted.rows.length !== 2) {
      throw new Error(
        `Expected to delete 2 records, actually deleted ${deleted.rows.length}.`
      );
    }

    // ------------------------------------------------------------
    // STEP 5 — Verify deletion
    // ------------------------------------------------------------

    console.log('\n[STEP 5] Verification...\n');

    const remaining = await client.query(`
      SELECT
        id,
        external_id,
        name,
        slug,
        topic_id
      FROM tutorial_subtopics
      WHERE LOWER(name) = LOWER('What is Java?')
    `);

    if (remaining.rows.length !== 0) {
      throw new Error(
        `Verification failed: ${remaining.rows.length} records remain.`
      );
    }

    const tutorialCount = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM tutorial_sections
    `);

    console.log(
      `Remaining "What is Java?" subtopics: ${remaining.rows.length}`
    );

    console.log(
      `Remaining tutorial_sections: ${tutorialCount.rows[0].count}`
    );

    // ------------------------------------------------------------
    // STEP 6 — Commit
    // ------------------------------------------------------------

    await client.query('COMMIT');

    console.log(`
══════════════════════════════════════════════════════════════════
✅ RESET SUCCESSFUL
══════════════════════════════════════════════════════════════════

Deleted:
  ✓ Old "whatisjava" subtopic
  ✓ Old "what-is-java?" subtopic
  ✓ Any tutorial_sections belonging to them

Preserved:
  ✓ tutorial_topics
  ✓ tutorial_sidebar_trees_v2
  ✓ Java sidebar/navigation
  ✓ Other subtopics
  ✓ Other hierarchy/master data

The "What Is Java?" TutorialDB subtopic can now be recreated
as a clean canonical record.
`);
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(`
══════════════════════════════════════════════════════════════════
❌ RESET ABORTED
══════════════════════════════════════════════════════════════════
`);

    console.error(error.message);
    console.error('\nNo changes were committed.');

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

resetWhatIsJavaSubtopics();
