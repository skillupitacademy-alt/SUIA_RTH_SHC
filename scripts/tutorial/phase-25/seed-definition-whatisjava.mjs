#!/usr/bin/env node

/**
 * PHASE 2.5 — SAFE D1 CONTENT SEED
 *
 * Target:
 *   Main DB subtopic: What is Java?
 *   Navigation Node:  whatisjava
 *   Brand:            shared
 *
 * SAFETY RULES:
 *   - DRY RUN by default
 *   - --apply required for DB write
 *   - Only exact target section may be changed
 *   - Only draft sections may be changed
 *   - Existing section ID is preserved
 *   - Existing navigationNodeId is preserved
 *   - Existing block ID is preserved
 *   - Existing metadata is preserved
 *   - Backup is written before update
 *   - No DELETE
 *   - No schema changes
 *   - No publish
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from 'dotenv';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// Load .env.local from project root
config({ path: path.join(PROJECT_ROOT, '.env.local') });

const FIXTURE_PATH = path.join(
  PROJECT_ROOT,
  'scripts/tutorial/phase-25/fixtures/definition-whatisjava.json'
);

const BACKUP_DIR = path.join(
  PROJECT_ROOT,
  '.analysis',
  'phase-25-backups'
);

const TARGET_NAVIGATION_NODE_ID = 'whatisjava';
const TARGET_BRAND_ID = 'shared';
const TARGET_SUBTOPIC_SLUG = 'whatisjava';

const APPLY = process.argv.includes('--apply');

function compactSlug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function printHeader(title) {
  console.log('');
  console.log('='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readFixture() {
  assert(
    fs.existsSync(FIXTURE_PATH),
    `Fixture does not exist:\n${FIXTURE_PATH}`
  );

  const raw = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const data = JSON.parse(raw);

  assert(
    data &&
      typeof data === 'object' &&
      data.page &&
      typeof data.page === 'object',
    'Fixture must contain a "page" object.'
  );

  assert(
    data.page.type === 'definition',
    `Expected page.type="definition", got "${data.page.type}".`
  );

  assert(
    data.page.title === 'What Is Java?',
    `Unexpected page title: "${data.page.title}".`
  );

  assert(
    data.page.example?.language === 'java',
    'Expected Java example language.'
  );

  assert(
    Array.isArray(data.page.characteristics),
    'characteristics must be an array.'
  );

  assert(
    data.page.characteristics.length >= 2 &&
      data.page.characteristics.length <= 4,
    'D1 characteristics must contain 2–4 items.'
  );

  return data;
}

async function createClient(connectionString, name) {
  assert(
    connectionString,
    `${name} connection string is missing.`
  );

  const client = new Client({
    connectionString,
  });

  await client.connect();

  return client;
}

async function resolveMainDbSubtopic(mainDb) {
  const result = await mainDb.query(
    `
      SELECT
        s.id,
        s.name,
        t.name AS topic_name
      FROM subtopics s
      JOIN topics t
        ON t.id = s.topic_id
      WHERE s.deleted_at IS NULL
        AND lower(regexp_replace(s.name, '[^a-zA-Z0-9]', '', 'g')) =
            $1
      ORDER BY s.id
      LIMIT 1
    `,
    [TARGET_SUBTOPIC_SLUG]
  );

  assert(
    result.rows.length === 1,
    `Could not resolve exactly one Main DB subtopic for "${TARGET_SUBTOPIC_SLUG}".`
  );

  return result.rows[0];
}

async function resolveTutorialSubtopic(tutorialDb, externalId) {
  const result = await tutorialDb.query(
    `
      SELECT
        id,
        external_id,
        name,
        slug
      FROM tutorial_subtopics
      WHERE external_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [externalId]
  );

  assert(
    result.rows.length === 1,
    `Could not resolve Tutorial DB subtopic for Main DB ID ${externalId}.`
  );

  return result.rows[0];
}

async function verifyNavigationNode(tutorialDb, mainSubtopicId) {
  /*
   * The sidebar tree stores the main curriculum IDs.
   * We verify the node exists inside the published/shared tree.
   *
   * We do not mutate the tree.
   */
  const result = await tutorialDb.query(
    `
      SELECT
        id,
        active_subtopic_id,
        brand_id,
        status,
        tree
      FROM tutorial_sidebar_trees_v2
      WHERE active_subtopic_id = $1
        AND brand_id = $2
        AND status = 'published'
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [mainSubtopicId, TARGET_BRAND_ID]
  );

  assert(
    result.rows.length === 1,
    'No published sidebar tree found for the target Main DB subtopic.'
  );

  const row = result.rows[0];

  function containsNode(value) {
    if (!value) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.some(containsNode);
    }

    if (typeof value !== 'object') {
      return false;
    }

    if (value.id === TARGET_NAVIGATION_NODE_ID) {
      return true;
    }

    return Object.values(value).some(containsNode);
  }

  assert(
    containsNode(row.tree),
    `Navigation node "${TARGET_NAVIGATION_NODE_ID}" was not found in the published sidebar tree.`
  );

  return row;
}

async function loadExistingSection(
  tutorialDb,
  tutorialSubtopicId
) {
  const result = await tutorialDb.query(
    `
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        order_index,
        content,
        version,
        language,
        status,
        generated_by_ai,
        ai_model_used,
        generation_job_id,
        quality_score,
        hallucination_score,
        regeneration_count,
        approved_by,
        approved_at,
        rejection_reason,
        prompt_template_id,
        educational_architecture_id,
        ui_architecture_id,
        brand_visibility,
        brand_customizations,
        created_at,
        updated_at,
        published_at,
        deleted_at
      FROM tutorial_sections
      WHERE subtopic_id = $1
        AND navigation_node_id = $2
        AND brand_id = $3
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 1
      FOR UPDATE
    `,
    [
      tutorialSubtopicId,
      TARGET_NAVIGATION_NODE_ID,
      TARGET_BRAND_ID,
    ]
  );

  assert(
    result.rows.length === 1,
    'Expected an existing draft section. No exact target section found.'
  );

  return result.rows[0];
}

function locateDefinitionBlock(content) {
  assert(
    content &&
      typeof content === 'object' &&
      Array.isArray(content.blocks),
    'Existing section content does not contain canonical blocks[].'
  );

  const index = content.blocks.findIndex(
    block =>
      block &&
      block.type === 'definition' &&
      block.version === 'D1'
  );

  assert(
    index >= 0,
    'Existing section does not contain a Definition D1 block.'
  );

  return index;
}

function buildUpdatedDocument(existingContent, pagePayload) {
  const document = structuredClone(existingContent);

  const index = locateDefinitionBlock(document);

  const existingBlock = document.blocks[index];

  assert(
    typeof existingBlock.id === 'string' &&
      existingBlock.id.length > 0,
    'Existing D1 block has no stable block ID.'
  );

  /*
   * IMPORTANT:
   *
   * We preserve:
   *   block.id
   *   block.type
   *   block.version
   *
   * We replace ONLY author content.
   *
   * The D1 prompt contract outputs:
   *
   * {
   *   "page": {
   *      ...
   *   }
   * }
   */
  document.blocks[index] = {
    ...existingBlock,
    content: pagePayload,
  };

  return {
    document,
    blockId: existingBlock.id,
  };
}

function createBackup(section) {
  fs.mkdirSync(BACKUP_DIR, {
    recursive: true,
  });

  const timestamp =
    new Date()
      .toISOString()
      .replace(/[:.]/g, '-');

  const fileName =
    `whatisjava-${section.id}-${timestamp}.json`;

  const backupPath =
    path.join(BACKUP_DIR, fileName);

  fs.writeFileSync(
    backupPath,
    JSON.stringify(section, null, 2),
    'utf8'
  );

  return backupPath;
}

async function updateSection(
  tutorialDb,
  section,
  updatedDocument
) {
  const result = await tutorialDb.query(
    `
      UPDATE tutorial_sections
      SET
        content = $1::jsonb,
        version = version + 1,
        updated_at = NOW()
      WHERE id = $2
        AND subtopic_id = $3
        AND navigation_node_id = $4
        AND brand_id = $5
        AND status = 'draft'
        AND deleted_at IS NULL
      RETURNING
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        version,
        jsonb_array_length(content->'blocks') AS block_count
    `,
    [
      JSON.stringify(updatedDocument),
      section.id,
      section.subtopic_id,
      TARGET_NAVIGATION_NODE_ID,
      TARGET_BRAND_ID,
    ]
  );

  assert(
    result.rows.length === 1,
    'UPDATE did not affect exactly one target draft section.'
  );

  return result.rows[0];
}

async function verifyAfterUpdate(
  tutorialDb,
  sectionId,
  expectedBlockId
) {
  const result = await tutorialDb.query(
    `
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        version,
        content
      FROM tutorial_sections
      WHERE id = $1
        AND deleted_at IS NULL
    `,
    [sectionId]
  );

  assert(
    result.rows.length === 1,
    'Updated section could not be read back.'
  );

  const row = result.rows[0];

  assert(
    row.navigation_node_id === TARGET_NAVIGATION_NODE_ID,
    'navigation_node_id changed unexpectedly.'
  );

  assert(
    row.brand_id === TARGET_BRAND_ID,
    'brand_id changed unexpectedly.'
  );

  assert(
    row.status === 'draft',
    `Section status changed unexpectedly: ${row.status}`
  );

  assert(
    row.content?.blocks?.length >= 1,
    'Updated document contains no blocks.'
  );

  const d1 = row.content.blocks.find(
    block =>
      block.type === 'definition' &&
      block.version === 'D1'
  );

  assert(
    d1,
    'Definition D1 block missing after update.'
  );

  assert(
    d1.id === expectedBlockId,
    'Definition D1 block ID changed unexpectedly.'
  );

  assert(
    d1.content?.page?.title === 'What Is Java?',
    'D1 content title was not persisted correctly.'
  );

  return row;
}

async function main() {
  printHeader(
    'PHASE 2.5 — SAFE WHAT-IS-JAVA D1 SEED'
  );

  console.log(
    `MODE: ${APPLY ? 'APPLY DATABASE UPDATE' : 'DRY RUN'}`
  );

  console.log(
    `Target navigationNodeId: ${TARGET_NAVIGATION_NODE_ID}`
  );

  console.log(
    `Target brandId: ${TARGET_BRAND_ID}`
  );

  console.log(
    `Fixture: ${FIXTURE_PATH}`
  );

  const fixture = readFixture();

  const mainDb = await createClient(
    process.env.DATABASE_URL,
    'DATABASE_URL'
  );

  const tutorialDb = await createClient(
    process.env.DATABASE_URL_TUTORIAL,
    'DATABASE_URL_TUTORIAL'
  );

  try {
    await tutorialDb.query('BEGIN');

    /*
     * Resolve hierarchy without modifying anything.
     */
    printHeader('STEP 1 — RESOLVE MAIN DB SUBTOPIC');

    const mainSubtopic =
      await resolveMainDbSubtopic(mainDb);

    console.log(
      'Main DB subtopic:',
      mainSubtopic.name
    );

    console.log(
      'Main DB subtopic ID:',
      mainSubtopic.id
    );

    console.log(
      'Topic:',
      mainSubtopic.topic_name
    );

    printHeader(
      'STEP 2 — RESOLVE TUTORIAL DB SUBTOPIC'
    );

    const tutorialSubtopic =
      await resolveTutorialSubtopic(
        tutorialDb,
        mainSubtopic.id
      );

    console.log(
      'Tutorial DB subtopic:',
      tutorialSubtopic.name
    );

    console.log(
      'Tutorial DB subtopic ID:',
      tutorialSubtopic.id
    );

    console.log(
      'external_id:',
      tutorialSubtopic.external_id
    );

    assert(
      tutorialSubtopic.external_id === mainSubtopic.id,
      'Cross-database subtopic identity mismatch.'
    );

    printHeader(
      'STEP 3 — VERIFY NAVIGATION NODE'
    );

    const sidebar =
      await verifyNavigationNode(
        tutorialDb,
        mainSubtopic.id
      );

    console.log(
      'Published sidebar tree:',
      sidebar.id
    );

    console.log(
      'Navigation node verified:',
      TARGET_NAVIGATION_NODE_ID
    );

    printHeader(
      'STEP 4 — LOAD EXACT EXISTING SECTION'
    );

    const section =
      await loadExistingSection(
        tutorialDb,
        tutorialSubtopic.id
      );

    console.log('Section ID:', section.id);
    console.log(
      'Tutorial DB subtopic ID:',
      section.subtopic_id
    );
    console.log(
      'navigationNodeId:',
      section.navigation_node_id
    );
    console.log(
      'brandId:',
      section.brand_id
    );
    console.log(
      'status:',
      section.status
    );
    console.log(
      'version:',
      section.version
    );

    assert(
      section.status === 'draft',
      `SAFETY STOP: target section is "${section.status}", not "draft".`
    );

    const d1Index =
      locateDefinitionBlock(section.content);

    const existingD1 =
      section.content.blocks[d1Index];

    console.log(
      'Existing D1 block ID:',
      existingD1.id
    );

    printHeader(
      'STEP 5 — BUILD UPDATED DOCUMENT'
    );

    const {
      document: updatedDocument,
      blockId,
    } = buildUpdatedDocument(
      section.content,
      fixture
    );

    console.log(
      'D1 block ID preserved:',
      blockId
    );

    console.log(
      'New title:',
      updatedDocument.blocks[d1Index].content.page.title
    );

    console.log(
      'Characteristics:',
      updatedDocument.blocks[d1Index]
        .content
        .page
        .characteristics.length
    );

    printHeader(
      'STEP 6 — SAFETY CHECKS'
    );

    assert(
      section.navigation_node_id ===
        TARGET_NAVIGATION_NODE_ID,
      'Navigation node mismatch.'
    );

    assert(
      section.brand_id === TARGET_BRAND_ID,
      'Brand mismatch.'
    );

    assert(
      existingD1.type === 'definition',
      'Existing block is not definition.'
    );

    assert(
      existingD1.version === 'D1',
      'Existing block is not D1.'
    );

    assert(
      existingD1.id === blockId,
      'Block identity changed.'
    );

    console.log('PASS navigation identity');
    console.log('PASS brand identity');
    console.log('PASS section identity');
    console.log('PASS block identity');
    console.log('PASS D1 version');
    console.log('PASS draft-only protection');

    if (!APPLY) {
      await tutorialDb.query('ROLLBACK');

      printHeader('DRY RUN COMPLETE');

      console.log(
        'NO DATABASE CHANGES WERE MADE.'
      );

      console.log('');
      console.log(
        'To actually apply this exact update:'
      );

      console.log('');
      console.log(
        'node scripts/tutorial/phase-25/seed-definition-whatisjava.mjs --apply'
      );

      return;
    }

    printHeader(
      'STEP 7 — BACKUP EXISTING SECTION'
    );

    const backupPath =
      createBackup(section);

    console.log(
      'Backup:',
      backupPath
    );

    printHeader(
      'STEP 8 — UPDATE EXACT DRAFT SECTION'
    );

    const updated =
      await updateSection(
        tutorialDb,
        section,
        updatedDocument
      );

    console.log(
      'Updated section:',
      updated.id
    );

    console.log(
      'Status:',
      updated.status
    );

    console.log(
      'Version:',
      updated.version
    );

    printHeader(
      'STEP 9 — READ-BACK VERIFICATION'
    );

    const verified =
      await verifyAfterUpdate(
        tutorialDb,
        section.id,
        blockId
      );

    console.log(
      'Verified section ID:',
      verified.id
    );

    console.log(
      'Verified navigationNodeId:',
      verified.navigation_node_id
    );

    console.log(
      'Verified status:',
      verified.status
    );

    console.log(
      'Verified title:',
      verified.content.blocks.find(
        block =>
          block.type === 'definition' &&
          block.version === 'D1'
      ).content.page.title
    );

    await tutorialDb.query('COMMIT');

    printHeader(
      'SUCCESS'
    );

    console.log(
      'Definition D1 content was safely updated.'
    );

    console.log(
      'No other tutorial section was modified.'
    );

    console.log(
      'Section remains DRAFT.'
    );

    console.log(
      'Nothing was published.'
    );
  } catch (error) {
    try {
      await tutorialDb.query('ROLLBACK');
    } catch {
      // Ignore rollback failure; original error is more important.
    }

    console.error('');
    console.error(
      'SAFE SEED FAILED — TRANSACTION ROLLED BACK'
    );
    console.error('');
    console.error(
      error instanceof Error
        ? error.message
        : String(error)
    );

    process.exitCode = 1;
  } finally {
    await mainDb.end();
    await tutorialDb.end();
  }
}

main();
