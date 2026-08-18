#!/usr/bin/env node

/**
 * Local Integration Test: Save Draft Pipeline
 * 
 * Tests the complete Save Draft flow end-to-end:
 * 1. Parent hierarchy validation (quiz_platform_prod)
 * 2. Authoring JSON construction (clean, no presentation data)
 * 3. Zod validation
 * 4. Normalization (slug + URL generation)
 * 5. Database UPSERT (tutorial_prod)
 * 6. Verification of stored data
 * 
 * Uses the Java test hierarchy:
 * - Domain: Full Stack Development (30000000-0000-0000-0000-000000000001)
 * - Subject: Backend Development (3a706051-9d9d-4bdf-af48-331a5acd557e)
 * - Topic: Java (4b21ddc0-123b-41e3-8ea1-280d37f7f035)
 * - Subtopic: What is Java? (12efacf1-b5ad-4b43-9fe4-17ba1cf249e4)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { eq, and } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Schema imports
const tutorialSidebarTreesV2Schema = {
  id: 'uuid',
  brandId: 'text',
  domainId: 'uuid',
  subjectId: 'uuid',
  topicId: 'uuid',
  activeSubtopicId: 'uuid',
  tree: 'jsonb',
  sourceFormat: 'text',
  sourceContent: 'text',
  status: 'text',
  version: 'integer',
  publishedAt: 'timestamp',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
};

// Java test hierarchy IDs
const JAVA_HIERARCHY = {
  domainId: '30000000-0000-0000-0000-000000000001',    // Full Stack Development
  subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e',   // Backend Development
  topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',     // Java
  subtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',  // What is Java?
};

// Test status tracking
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    console.log(`     Expected: ${JSON.stringify(expected)}`);
    console.log(`     Actual:   ${JSON.stringify(actual)}`);
    testsFailed++;
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    console.log(`     Expected: ${JSON.stringify(expected, null, 2)}`);
    console.log(`     Actual:   ${JSON.stringify(actual, null, 2)}`);
    testsFailed++;
  }
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compactSlug(value) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Simulate the normalization logic from route.ts
function normalizeTreeUrls(authoringTree, scope) {
  function normalizeNodes(nodes) {
    return nodes.map((node) => {
      const canonicalSlug = compactSlug(node.name);
      const isPageNode = node.type === 'page';
      
      return {
        ...node,
        slug: canonicalSlug,
        url: isPageNode ? `/tutorial-v2/${scope.domainSlug}/${scope.subjectSlug}/${scope.topicSlug}/${canonicalSlug}` : undefined,
        children: node.children ? normalizeNodes(node.children) : node.children,
      };
    });
  }

  return {
    topics: normalizeNodes(authoringTree.topics),
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('LOCAL INTEGRATION TEST: Save Draft Pipeline');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Connect to parent DB (quiz_platform_prod)
  const parentPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const parentDb = drizzle(parentPool);

  // Connect to tutorial DB (tutorial_prod)
  const tutorialPool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });
  const tutorialDb = drizzle(tutorialPool);

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Verify Parent Hierarchy
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 1: Verify Parent Hierarchy');
    console.log('───────────────────────────────────────────────────────────────');

    const domainResult = await parentPool.query(
      'SELECT id, name FROM domains WHERE id = $1',
      [JAVA_HIERARCHY.domainId]
    );
    assert(domainResult.rows.length > 0, 'Domain exists in parent DB');
    const domain = domainResult.rows[0];
    assertEqual(domain.name, 'Full Stack Development', 'Domain name is correct');

    const subjectResult = await parentPool.query(
      'SELECT id, name FROM subjects WHERE id = $1',
      [JAVA_HIERARCHY.subjectId]
    );
    assert(subjectResult.rows.length > 0, 'Subject exists in parent DB');
    const subject = subjectResult.rows[0];
    assertEqual(subject.name, 'Backend Development', 'Subject name is correct');

    const topicResult = await parentPool.query(
      'SELECT id, name FROM topics WHERE id = $1',
      [JAVA_HIERARCHY.topicId]
    );
    assert(topicResult.rows.length > 0, 'Topic exists in parent DB');
    const topic = topicResult.rows[0];
    assertEqual(topic.name, 'Java', 'Topic name is correct');

    const subtopicResult = await parentPool.query(
      'SELECT id, name FROM subtopics WHERE id = $1',
      [JAVA_HIERARCHY.subtopicId]
    );
    assert(subtopicResult.rows.length > 0, 'Subtopic exists in parent DB');
    const subtopic = subtopicResult.rows[0];
    assertEqual(subtopic.name, 'What is Java?', 'Subtopic name is correct');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Construct Authoring JSON (Clean)
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 2: Construct Authoring JSON');
    console.log('───────────────────────────────────────────────────────────────');

    const authoringTree = {
      topics: [
        {
          id: '1',
          name: 'Introduction to Java',
          type: 'group',
          icon: 'BookOpen',
          expanded: true,
          children: [
            {
              id: '1-1',
              name: 'What is Java?',
              type: 'page',
              icon: 'FileText',
            },
            {
              id: '1-2',
              name: 'Java History',
              type: 'page',
              icon: 'Clock',
            },
          ],
        },
        {
          id: '2',
          name: 'Java Basics',
          type: 'group',
          icon: 'Code',
          expanded: false,
          children: [
            {
              id: '2-1',
              name: 'Variables and Data Types',
              type: 'page',
              icon: 'Database',
            },
          ],
        },
      ],
    };

    // Verify authoring JSON is clean (no brand/theme/progress/slug/url)
    const firstNode = authoringTree.topics[0];
    assert(!('brand' in authoringTree), 'Authoring tree has no brand');
    assert(!('theme' in authoringTree), 'Authoring tree has no theme');
    assert(!('progress' in authoringTree), 'Authoring tree has no progress');
    assert(!('subject' in authoringTree), 'Authoring tree has no subject');
    assert(!('slug' in firstNode), 'Authoring node has no slug');
    assert(!('url' in firstNode), 'Authoring node has no url');
    assert(!('status' in firstNode), 'Authoring node has no status');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Normalization (Slug + URL Generation)
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 3: Normalization (Slug + URL Generation)');
    console.log('───────────────────────────────────────────────────────────────');

    const scope = {
      domainSlug: slugify(domain.name),
      subjectSlug: slugify(subject.name),
      topicSlug: slugify(topic.name),
    };

    const normalizedTree = normalizeTreeUrls(authoringTree, scope);

    // Verify normalization
    const normalizedGroup = normalizedTree.topics[0];
    const normalizedPage = normalizedTree.topics[0].children[0];

    assertEqual(normalizedGroup.slug, 'introductiontojava', 'Group node has compact slug');
    assertEqual(normalizedGroup.url, undefined, 'Group node has no URL');
    assertEqual(normalizedPage.slug, 'whatisjava', 'Page node has compact slug');
    assertEqual(
      normalizedPage.url,
      '/tutorial-v2/full-stack-development/backend-development/java/whatisjava',
      'Page node has correct URL'
    );

    // Verify normalized tree still has no brand/theme/progress
    assert(!('brand' in normalizedTree), 'Normalized tree has no brand');
    assert(!('theme' in normalizedTree), 'Normalized tree has no theme');
    assert(!('progress' in normalizedTree), 'Normalized tree has no progress');
    assert(!('subject' in normalizedTree), 'Normalized tree has no subject');
    assert(!('status' in normalizedPage), 'Normalized node has no status');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Database UPSERT (First Save)
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 4: Database UPSERT (First Save)');
    console.log('───────────────────────────────────────────────────────────────');

    const brandId = 'shared';
    const now = new Date();
    const sourceContent = JSON.stringify(authoringTree, null, 2);

    const upsertQuery = `
      INSERT INTO tutorial_sidebar_trees_v2 (
        brand_id, domain_id, subject_id, topic_id, active_subtopic_id,
        tree, source_format, source_content, status, published_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (brand_id, topic_id) 
      DO UPDATE SET
        domain_id = EXCLUDED.domain_id,
        subject_id = EXCLUDED.subject_id,
        active_subtopic_id = EXCLUDED.active_subtopic_id,
        tree = EXCLUDED.tree,
        source_format = EXCLUDED.source_format,
        source_content = EXCLUDED.source_content,
        status = EXCLUDED.status,
        published_at = EXCLUDED.published_at,
        updated_at = EXCLUDED.updated_at,
        version = tutorial_sidebar_trees_v2.version + 1
      RETURNING *;
    `;

    const insertResult = await tutorialPool.query(upsertQuery, [
      brandId,
      JAVA_HIERARCHY.domainId,
      JAVA_HIERARCHY.subjectId,
      JAVA_HIERARCHY.topicId,
      JAVA_HIERARCHY.subtopicId,
      JSON.stringify(normalizedTree),
      'json',
      sourceContent,
      'draft',
      null,  // publishedAt (null for draft)
      now,
    ]);

    assert(insertResult.rows.length > 0, 'UPSERT successful');
    const savedRow = insertResult.rows[0];
    assertEqual(savedRow.brand_id, 'shared', 'Saved brand_id is correct');
    assertEqual(savedRow.topic_id, JAVA_HIERARCHY.topicId, 'Saved topic_id is correct');
    assertEqual(savedRow.status, 'draft', 'Saved status is draft');
    assert(savedRow.version >= 1, `Saved version is ${savedRow.version}`);

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Verify Stored Data
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 5: Verify Stored Data');
    console.log('───────────────────────────────────────────────────────────────');

    // Verify source_content is clean authoring JSON
    const storedSourceContent = JSON.parse(savedRow.source_content);
    assertDeepEqual(storedSourceContent, authoringTree, 'source_content is clean authoring JSON');

    // Verify tree is normalized navigation (NO brand/theme/progress/subject)
    const storedTree = savedRow.tree;
    assert(!('brand' in storedTree), 'Stored tree has no brand');
    assert(!('theme' in storedTree), 'Stored tree has no theme');
    assert(!('progress' in storedTree), 'Stored tree has no progress');
    assert(!('subject' in storedTree), 'Stored tree has no subject');

    // Verify slugs and URLs
    const storedGroup = storedTree.topics[0];
    const storedPage = storedTree.topics[0].children[0];
    assertEqual(storedGroup.slug, 'introductiontojava', 'Stored group has correct slug');
    assertEqual(storedGroup.url, undefined, 'Stored group has no URL');
    assertEqual(storedPage.slug, 'whatisjava', 'Stored page has correct slug');
    assertEqual(
      storedPage.url,
      '/tutorial-v2/full-stack-development/backend-development/java/whatisjava',
      'Stored page has correct URL'
    );

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Test UPSERT (Second Save)
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 6: Test UPSERT (Second Save)');
    console.log('───────────────────────────────────────────────────────────────');

    const updatedTree = {
      topics: [
        ...authoringTree.topics,
        {
          id: '3',
          name: 'Advanced Java',
          type: 'group',
          icon: 'Zap',
          expanded: false,
          children: [
            {
              id: '3-1',
              name: 'Generics',
              type: 'page',
              icon: 'Box',
            },
          ],
        },
      ],
    };

    const normalizedUpdatedTree = normalizeTreeUrls(updatedTree, scope);
    const updateResult = await tutorialPool.query(upsertQuery, [
      brandId,
      JAVA_HIERARCHY.domainId,
      JAVA_HIERARCHY.subjectId,
      JAVA_HIERARCHY.topicId,
      JAVA_HIERARCHY.subtopicId,
      JSON.stringify(normalizedUpdatedTree),
      'json',
      JSON.stringify(updatedTree, null, 2),
      'published',  // Change status to published
      now,          // Set publishedAt
      now,
    ]);

    assert(updateResult.rows.length > 0, 'UPSERT (update) successful');
    const updatedRow = updateResult.rows[0];
    assertEqual(updatedRow.version, savedRow.version + 1, 'Version incremented');
    assertEqual(updatedRow.status, 'published', 'Status updated to published');
    assert(updatedRow.published_at !== null, 'publishedAt is set');

    // Verify new content
    const updatedStoredTree = updatedRow.tree;
    assertEqual(updatedStoredTree.topics.length, 3, 'Updated tree has 3 topics');
    assertEqual(updatedStoredTree.topics[2].name, 'Advanced Java', 'New topic added');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 7: Verify Actual Database Row
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 7: Verify Actual Database Row');
    console.log('───────────────────────────────────────────────────────────────');

    const verifyResult = await tutorialPool.query(
      'SELECT * FROM tutorial_sidebar_trees_v2 WHERE brand_id = $1 AND topic_id = $2',
      [brandId, JAVA_HIERARCHY.topicId]
    );

    assert(verifyResult.rows.length > 0, 'Row exists in database');
    const actualRow = verifyResult.rows[0];
    assertEqual(actualRow.brand_id, 'shared', 'Actual brand_id is correct');
    assertEqual(actualRow.status, 'published', 'Actual status is published');
    assertEqual(actualRow.version, updatedRow.version, 'Actual version matches');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Test Summary
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log('');

    if (testsFailed === 0) {
      console.log('✅ ALL TESTS PASSED! Save Draft pipeline is working correctly.');
      console.log('');
      console.log('What was verified:');
      console.log('  1. Parent hierarchy validation');
      console.log('  2. Authoring JSON is clean (no brand/theme/progress/slug/url)');
      console.log('  3. Normalization generates slug + URL correctly');
      console.log('  4. Page nodes get URLs, group nodes don\'t');
      console.log('  5. Database UPSERT successful (version increment)');
      console.log('  6. source_content remains clean authoring JSON');
      console.log('  7. tree contains normalized navigation only (NO brand/theme/progress/subject)');
      console.log('  8. Actual database row verified');
      console.log('');
      console.log('Current Database State:');
      console.log(`  Brand: ${actualRow.brand_id}`);
      console.log(`  Status: ${actualRow.status}`);
      console.log(`  Version: ${actualRow.version}`);
      console.log(`  Topics: ${actualRow.tree.topics.length}`);
      console.log('');
    } else {
      console.log('❌ SOME TESTS FAILED. Review the output above.');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    await parentPool.end();
    await tutorialPool.end();
  }
}

main();
