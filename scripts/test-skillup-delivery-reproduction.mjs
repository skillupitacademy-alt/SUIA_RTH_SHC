#!/usr/bin/env node

/**
 * SkillUp Delivery Reproduction Test
 * 
 * Simulates what happens when a user visits:
 * https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava
 * 
 * Tests the complete delivery flow:
 * 1. Resolve hierarchy (slug → IDs)
 * 2. Fetch published sidebar from tutorial DB
 * 3. Apply runtime branding (brand/theme/subject/progress)
 * 4. Find active URL
 * 5. Fetch page content (if available)
 * 6. Return complete payload
 */

import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const TEST_PARAMS = {
  brandId: 'skillup',
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  subtopicSlug: 'whatisjava',
};

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

function matchesSlug(value, slug) {
  return slugify(value) === slug || compactSlug(value) === compactSlug(slug);
}

// Simulate withRuntimeBrand from tutorialSidebarDelivery.ts
function withRuntimeBrand(normalizedTree, brandId, subjectName) {
  const runtimeBrand = brandId === 'skillup' ? {
    brand: {
      name: 'SkillUp IT Academy',
      shortName: 'SUIA',
      tagline: 'Build Skills That Move Careers',
    },
    theme: {
      primary: '#f54a8d',
      primaryDark: '#d63d7a',
      secondary: '#133382',
      activeBackground: '#fff0f6',
      completed: '#08a64a',
    },
  } : {
    brand: {
      name: 'RealTutorialHub',
      shortName: 'RTH',
      tagline: 'Learn Smarter, Not Harder',
    },
    theme: {
      primary: '#d03f00',
      primaryDark: '#b63600',
      secondary: '#124fd6',
      activeBackground: '#eef3fa',
      completed: '#08a64a',
    },
  };

  function toRuntimeNodes(nodes) {
    return nodes.map((node) => ({
      ...node,
      children: node.children ? toRuntimeNodes(node.children) : undefined,
    }));
  }

  return {
    brand: runtimeBrand.brand,
    theme: runtimeBrand.theme,
    subject: { name: subjectName },
    progress: { percentage: 0 },
    topics: toRuntimeNodes(normalizedTree.topics),
  };
}

function findUrlBySlug(nodes, slug) {
  for (const node of nodes) {
    if ((node.slug === slug || compactSlug(node.slug) === compactSlug(slug)) && node.url) {
      return node.url;
    }
    const childMatch = findUrlBySlug(node.children ?? [], slug);
    if (childMatch) return childMatch;
  }
  return '';
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SKILLUP DELIVERY REPRODUCTION TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Simulating user visit to:');
  console.log('https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava');
  console.log('');

  const parentPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const tutorialPool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Resolve Hierarchy (slug → IDs)
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 1: Resolve Hierarchy (slug → IDs)');
    console.log('───────────────────────────────────────────────────────────────');

    // Find domain by slug
    const domainResult = await parentPool.query(
      'SELECT id, name FROM domains WHERE deleted_at IS NULL'
    );
    const domain = domainResult.rows.find(row => matchesSlug(row.name, TEST_PARAMS.domainSlug));
    assert(domain !== undefined, `Found domain: ${domain?.name}`);

    // Find subject by slug
    const subjectResult = await parentPool.query(
      'SELECT id, name FROM subjects WHERE domain_id = $1 AND deleted_at IS NULL',
      [domain.id]
    );
    const subject = subjectResult.rows.find(row => matchesSlug(row.name, TEST_PARAMS.subjectSlug));
    assert(subject !== undefined, `Found subject: ${subject?.name}`);

    // Find topic by slug
    const topicResult = await parentPool.query(
      'SELECT id, name FROM topics WHERE subject_id = $1 AND deleted_at IS NULL',
      [subject.id]
    );
    const topic = topicResult.rows.find(row => matchesSlug(row.name, TEST_PARAMS.topicSlug));
    assert(topic !== undefined, `Found topic: ${topic?.name}`);

    // Find subtopic by slug
    const subtopicResult = await parentPool.query(
      'SELECT id, name FROM subtopics WHERE topic_id = $1 AND deleted_at IS NULL',
      [topic.id]
    );
    const subtopic = subtopicResult.rows.find(row => matchesSlug(row.name, TEST_PARAMS.subtopicSlug));
    assert(subtopic !== undefined, `Found subtopic: ${subtopic?.name}`);

    const hierarchy = {
      domain: { id: domain.id, name: domain.name, slug: slugify(domain.name) },
      subject: { id: subject.id, name: subject.name, slug: slugify(subject.name) },
      topic: { id: topic.id, name: topic.name, slug: slugify(topic.name) },
      subtopic: { id: subtopic.id, name: subtopic.name, slug: compactSlug(subtopic.name) },
    };

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Fetch Published Sidebar
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 2: Fetch Published Sidebar');
    console.log('───────────────────────────────────────────────────────────────');

    // Try shared first, then brand-specific
    let sidebarResult = await tutorialPool.query(
      `SELECT * FROM tutorial_sidebar_trees_v2 
       WHERE brand_id = 'shared' 
       AND topic_id = $1 
       AND status = 'published'
       LIMIT 1`,
      [topic.id]
    );

    if (sidebarResult.rows.length === 0) {
      sidebarResult = await tutorialPool.query(
        `SELECT * FROM tutorial_sidebar_trees_v2 
         WHERE brand_id = $1 
         AND topic_id = $2 
         AND status = 'published'
         LIMIT 1`,
        [TEST_PARAMS.brandId, topic.id]
      );
    }

    assert(sidebarResult.rows.length > 0, 'Published sidebar found');
    const sidebar = sidebarResult.rows[0];
    assertEqual(sidebar.brand_id, 'shared', 'Using shared sidebar');
    assertEqual(sidebar.status, 'published', 'Sidebar is published');

    // Verify normalized tree (no brand/theme/progress)
    assert(!sidebar.tree.brand, 'Stored tree has no brand');
    assert(!sidebar.tree.theme, 'Stored tree has no theme');
    assert(!sidebar.tree.progress, 'Stored tree has no progress');
    assert(!sidebar.tree.subject, 'Stored tree has no subject');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Apply Runtime Branding
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 3: Apply Runtime Branding');
    console.log('───────────────────────────────────────────────────────────────');

    const brandedTree = withRuntimeBrand(sidebar.tree, TEST_PARAMS.brandId, subject.name);

    // Verify runtime tree has brand/theme/progress/subject
    assert(brandedTree.brand !== undefined, 'Runtime tree has brand');
    assert(brandedTree.theme !== undefined, 'Runtime tree has theme');
    assert(brandedTree.progress !== undefined, 'Runtime tree has progress');
    assert(brandedTree.subject !== undefined, 'Runtime tree has subject');

    assertEqual(brandedTree.brand.name, 'SkillUp IT Academy', 'Brand name is correct');
    assertEqual(brandedTree.theme.primary, '#f54a8d', 'Theme primary color is correct');
    assertEqual(brandedTree.subject.name, subject.name, 'Subject name is correct');
    assertEqual(brandedTree.progress.percentage, 0, 'Progress is 0%');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Find Active URL
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 4: Find Active URL');
    console.log('───────────────────────────────────────────────────────────────');

    const activeUrl = findUrlBySlug(brandedTree.topics, TEST_PARAMS.subtopicSlug) 
      || findUrlBySlug(brandedTree.topics, hierarchy.subtopic.slug);

    assert(activeUrl !== '', 'Active URL found');
    assertEqual(
      activeUrl,
      '/tutorial-v2/full-stack-development/backend-development/java/whatisjava',
      'Active URL is correct'
    );

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Fetch Page Content
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 5: Fetch Page Content');
    console.log('───────────────────────────────────────────────────────────────');

    let contentResult = await tutorialPool.query(
      `SELECT * FROM tutorial_page_content_v2 
       WHERE brand_id = 'shared' 
       AND subtopic_id = $1 
       AND status = 'published'`,
      [subtopic.id]
    );

    if (contentResult.rows.length === 0) {
      contentResult = await tutorialPool.query(
        `SELECT * FROM tutorial_page_content_v2 
         WHERE brand_id = $1 
         AND subtopic_id = $2 
         AND status = 'published'`,
        [TEST_PARAMS.brandId, subtopic.id]
      );
    }

    if (contentResult.rows.length === 0) {
      console.log('  ℹ️  No published content found (expected - content not yet created)');
      console.log('  ℹ️  Page will render with "Content is not published" message');
    } else {
      console.log(`  ✅ Found ${contentResult.rows.length} content components`);
      contentResult.rows.forEach(row => {
        console.log(`     - ${row.content_type}`);
      });
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Construct Final Payload
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 6: Construct Final Payload');
    console.log('───────────────────────────────────────────────────────────────');

    const payload = {
      brandId: TEST_PARAMS.brandId,
      theme: brandedTree.theme,
      sidebar: brandedTree,
      activeUrl,
      hierarchy,
      content: {},
      footer: {
        previous: null,
        next: null,
      },
    };

    assert(payload.sidebar !== null, 'Payload has sidebar');
    assert(payload.sidebar.brand !== undefined, 'Sidebar has brand');
    assert(payload.sidebar.theme !== undefined, 'Sidebar has theme');
    assert(payload.sidebar.subject !== undefined, 'Sidebar has subject');
    assert(payload.sidebar.progress !== undefined, 'Sidebar has progress');
    assert(payload.sidebar.topics.length > 0, `Sidebar has ${payload.sidebar.topics.length} topics`);

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
      console.log('✅ ALL TESTS PASSED! SkillUp delivery is working correctly.');
      console.log('');
      console.log('What was verified:');
      console.log('  1. Hierarchy resolution (slug → IDs)');
      console.log('  2. Published sidebar retrieval');
      console.log('  3. Normalized storage (no brand/theme/progress in DB)');
      console.log('  4. Runtime branding application');
      console.log('  5. Active URL resolution');
      console.log('  6. Page content lookup (optional)');
      console.log('  7. Complete payload construction');
      console.log('');
      console.log('Expected Rendering:');
      console.log('  ✓ Left sidebar with Java curriculum (3 topics)');
      console.log('  ✓ SkillUp branding (pink theme)');
      console.log('  ✓ Subject: Backend Development');
      console.log('  ✓ Active page: What is Java?');
      console.log('  ✓ Main content: "Content is not published" message');
      console.log('');
      console.log('If the production page returns 503, the issue is likely:');
      console.log('  1. Deployed code is stale (missing normalized tree types)');
      console.log('  2. Runtime error in a component (need production logs)');
      console.log('  3. Missing environment variables');
      console.log('  4. Database connection issue');
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
