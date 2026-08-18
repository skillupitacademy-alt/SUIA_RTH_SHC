#!/usr/bin/env node
/**
 * LOCAL SAVE DRAFT INTEGRATION TEST
 * 
 * Tests the complete Save Draft flow:
 * 1. Authoring JSON → Zod validation
 * 2. Depth/type validation
 * 3. Normalization (slug + URL generation)
 * 4. Database INSERT/UPSERT
 * 5. Actual row inspection
 * 
 * Uses verified Java hierarchy from parent DB.
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TUTORIAL_DB = process.env.DATABASE_URL_TUTORIAL;
const PARENT_DB = process.env.DATABASE_URL;

if (!TUTORIAL_DB || !PARENT_DB) {
  console.error('❌ Required: DATABASE_URL_TUTORIAL and DATABASE_URL');
  process.exit(1);
}

const tutorialSql = neon(TUTORIAL_DB);
const parentSql = neon(PARENT_DB);

console.log('\n🧪 LOCAL SAVE DRAFT INTEGRATION TEST');
console.log('====================================\n');

// Verified Java hierarchy from parent DB
const TEST_HIERARCHY = {
  domainId: '30000000-0000-0000-0000-000000000001',
  subjectId: '3a706051-9d9d-4bdf-af48-331a5acd557e',
  topicId: '4b21ddc0-123b-41e3-8ea1-280d37f7f035',
  subtopicId: '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',
};

// Clean authoring JSON (universal navigation)
const AUTHORING_JSON = {
  topics: [
    {
      id: 'java',
      name: 'Java',
      type: 'group',
      icon: 'java',
      expanded: true,
      children: [
        {
          id: 'java-fundamentals',
          name: 'Fundamentals',
          type: 'group',
          icon: 'book',
          expanded: true,
          children: [
            {
              id: 'what-is-java',
              name: 'What Is Java?',
              type: 'page',
              icon: 'folder'
            },
            {
              id: 'java-syntax',
              name: 'Syntax & Structure',
              type: 'page',
              icon: 'folder'
            }
          ]
        },
        {
          id: 'oop',
          name: 'Object-Oriented Programming',
          type: 'group',
          icon: 'code',
          children: [
            {
              id: 'classes-objects',
              name: 'Classes & Objects',
              type: 'page',
              icon: 'folder'
            }
          ]
        }
      ]
    }
  ]
};

let testPassed = true;
let existingRow = null;

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

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ ASSERTION FAILED: ${message}`);
    testPassed = false;
  } else {
    console.log(`  ✅ ${message}`);
  }
}

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
  try {
    // ============================================================
    // STEP 1: VERIFY PARENT HIERARCHY
    // ============================================================
    console.log('1️⃣  PARENT HIERARCHY VERIFICATION\n');
    
    const [domain] = await parentSql`
      SELECT id, name FROM domains 
      WHERE id = ${TEST_HIERARCHY.domainId} AND deleted_at IS NULL
    `;
    assert(domain, 'Domain exists in parent DB');
    
    const [subject] = await parentSql`
      SELECT id, name, domain_id FROM subjects 
      WHERE id = ${TEST_HIERARCHY.subjectId} AND deleted_at IS NULL
    `;
    assert(subject && subject.domain_id === domain.id, 'Subject exists and belongs to domain');
    
    const [topic] = await parentSql`
      SELECT id, name, subject_id FROM topics 
      WHERE id = ${TEST_HIERARCHY.topicId} AND deleted_at IS NULL
    `;
    assert(topic && topic.subject_id === subject.id, 'Topic exists and belongs to subject');
    
    const [subtopic] = await parentSql`
      SELECT id, name, topic_id FROM subtopics 
      WHERE id = ${TEST_HIERARCHY.subtopicId} AND deleted_at IS NULL
    `;
    assert(subtopic && subtopic.topic_id === topic.id, 'Subtopic exists and belongs to topic');
    
    console.log(`\n  Hierarchy: ${domain.name} → ${subject.name} → ${topic.name} → ${subtopic.name}\n`);
    
    if (!testPassed) {
      throw new Error('Parent hierarchy validation failed');
    }

    // ============================================================
    // STEP 2: CHECK EXISTING ROW
    // ============================================================
    console.log('2️⃣  EXISTING ROW CHECK\n');
    
    const existing = await tutorialSql`
      SELECT id, version, status, brand_id, topic_id 
      FROM tutorial_sidebar_trees_v2
      WHERE brand_id = 'shared' AND topic_id = ${TEST_HIERARCHY.topicId}
    `;
    
    if (existing.length > 0) {
      existingRow = existing[0];
      console.log(`  ⚠️  EXISTING ROW FOUND:`);
      console.log(`     ID: ${existingRow.id}`);
      console.log(`     Version: ${existingRow.version}`);
      console.log(`     Status: ${existingRow.status}`);
      console.log(`     This test will UPSERT (UPDATE existing)\n`);
    } else {
      console.log(`  ✅ No existing row for (shared, topic:${TEST_HIERARCHY.topicId.slice(0, 8)}...)`);
      console.log(`     This test will INSERT new row\n`);
    }

    // ============================================================
    // STEP 3: VALIDATE AUTHORING JSON
    // ============================================================
    console.log('3️⃣  AUTHORING JSON VALIDATION\n');
    
    assert(AUTHORING_JSON.topics, 'Has topics array');
    assert(!AUTHORING_JSON.brand, 'No brand field');
    assert(!AUTHORING_JSON.theme, 'No theme field');
    assert(!AUTHORING_JSON.progress, 'No progress field');
    assert(!AUTHORING_JSON.subject, 'No subject field');
    
    function validateNode(node, path) {
      assert(node.id, `${path} has id`);
      assert(node.name, `${path} has name`);
      assert(node.type, `${path} has type`);
      assert(!node.slug, `${path} has no author-supplied slug`);
      assert(!node.url, `${path} has no author-supplied url`);
      assert(!node.status, `${path} has no author-supplied status`);
      
      if (node.type === 'page') {
        assert(!node.children || node.children.length === 0, `${path} page has no children`);
      }
      
      if (node.type === 'group') {
        assert(node.children && node.children.length > 0, `${path} group has children`);
      }
      
      if (node.children) {
        node.children.forEach((child, i) => validateNode(child, `${path}.children[${i}]`));
      }
    }
    
    AUTHORING_JSON.topics.forEach((t, i) => validateNode(t, `topics[${i}]`));
    console.log('');
    
    if (!testPassed) {
      throw new Error('Authoring JSON validation failed');
    }

    // ============================================================
    // STEP 4: NORMALIZATION (SLUG + URL GENERATION)
    // ============================================================
    console.log('4️⃣  NORMALIZATION (SLUG + URL GENERATION)\n');
    
    const scope = {
      domainSlug: slugify(domain.name),
      subjectSlug: slugify(subject.name),
      topicSlug: slugify(topic.name),
    };
    
    console.log(`  Domain slug: ${scope.domainSlug}`);
    console.log(`  Subject slug: ${scope.subjectSlug}`);
    console.log(`  Topic slug: ${scope.topicSlug}\n`);
    
    const normalizedTree = normalizeTreeUrls(AUTHORING_JSON, scope);
    
    assert(normalizedTree.topics, 'Normalized tree has topics');
    assert(!normalizedTree.brand, 'Normalized tree has no brand');
    assert(!normalizedTree.theme, 'Normalized tree has no theme');
    
    // Check first page node has URL
    const firstPage = normalizedTree.topics[0].children[0].children[0];
    assert(firstPage.type === 'page', 'First leaf is page');
    assert(firstPage.slug === 'whatisjava', 'Page slug generated correctly');
    assert(firstPage.url === `/tutorial-v2/${scope.domainSlug}/${scope.subjectSlug}/${scope.topicSlug}/whatisjava`, 'Page URL generated correctly');
    
    // Check group node has NO URL
    const firstGroup = normalizedTree.topics[0].children[0];
    assert(firstGroup.type === 'group', 'First branch is group');
    assert(firstGroup.slug === 'fundamentals', 'Group slug generated');
    assert(!firstGroup.url, 'Group has NO URL');
    
    console.log('');
    
    if (!testPassed) {
      throw new Error('Normalization validation failed');
    }

    // ============================================================
    // STEP 5: DATABASE INSERT/UPSERT
    // ============================================================
    console.log('5️⃣  DATABASE INSERT/UPSERT\n');
    
    const now = new Date();
    const values = {
      brandId: 'shared',
      domainId: TEST_HIERARCHY.domainId,
      subjectId: TEST_HIERARCHY.subjectId,
      topicId: TEST_HIERARCHY.topicId,
      activeSubtopicId: TEST_HIERARCHY.subtopicId,
      tree: normalizedTree,
      sourceFormat: 'json',
      sourceContent: JSON.stringify(AUTHORING_JSON, null, 2),
      status: 'draft',
      publishedAt: null,
      updatedAt: now,
    };
    
    console.log(`  Executing UPSERT for (brand_id='shared', topic_id='${TEST_HIERARCHY.topicId.slice(0, 8)}...')\n`);
    
    const [saved] = await tutorialSql`
      INSERT INTO tutorial_sidebar_trees_v2 (
        brand_id, domain_id, subject_id, topic_id, active_subtopic_id,
        tree, source_format, source_content, status, published_at, updated_at
      ) VALUES (
        ${values.brandId}, ${values.domainId}, ${values.subjectId}, 
        ${values.topicId}, ${values.activeSubtopicId},
        ${JSON.stringify(values.tree)}, ${values.sourceFormat}, 
        ${values.sourceContent}, ${values.status}, 
        ${values.publishedAt}, ${values.updatedAt}
      )
      ON CONFLICT (brand_id, topic_id) DO UPDATE SET
        domain_id = ${values.domainId},
        subject_id = ${values.subjectId},
        topic_id = ${values.topicId},
        active_subtopic_id = ${values.activeSubtopicId},
        tree = ${JSON.stringify(values.tree)},
        source_format = ${values.sourceFormat},
        source_content = ${values.sourceContent},
        status = ${values.status},
        version = tutorial_sidebar_trees_v2.version + 1,
        published_at = ${values.publishedAt},
        updated_at = ${values.updatedAt}
      RETURNING id, version, status, brand_id, topic_id, created_at, updated_at
    `;
    
    console.log(`  ✅ UPSERT successful!`);
    console.log(`     ID: ${saved.id}`);
    console.log(`     Version: ${saved.version}`);
    console.log(`     Status: ${saved.status}\n`);
    
    if (existingRow) {
      assert(saved.id === existingRow.id, 'Same ID (UPDATE not INSERT)');
      assert(saved.version === existingRow.version + 1, `Version incremented (${existingRow.version} → ${saved.version})`);
    } else {
      assert(saved.version === 1, 'Version = 1 (new record)');
    }
    
    console.log('');

    // ============================================================
    // STEP 6: INSPECT ACTUAL ROW
    // ============================================================
    console.log('6️⃣  ACTUAL ROW INSPECTION\n');
    
    const [inspected] = await tutorialSql`
      SELECT 
        id, brand_id, domain_id, subject_id, topic_id, active_subtopic_id,
        tree, source_format, source_content, status, version,
        published_at, created_at, updated_at
      FROM tutorial_sidebar_trees_v2
      WHERE id = ${saved.id}
    `;
    
    // Validate source_content
    const sourceContentParsed = JSON.parse(inspected.source_content);
    assert(sourceContentParsed.topics, 'source_content has topics');
    assert(!sourceContentParsed.brand, 'source_content has NO brand');
    assert(!sourceContentParsed.theme, 'source_content has NO theme');
    assert(!sourceContentParsed.progress, 'source_content has NO progress');
    assert(!sourceContentParsed.topics[0].slug, 'source_content nodes have NO slug');
    assert(!sourceContentParsed.topics[0].children[0].children[0].url, 'source_content page nodes have NO url');
    
    // Validate tree
    const treeParsed = inspected.tree;
    assert(treeParsed.topics, 'tree has topics');
    assert(!treeParsed.brand, 'tree has NO brand');
    assert(!treeParsed.theme, 'tree has NO theme');
    assert(!treeParsed.progress, 'tree has NO progress');
    assert(!treeParsed.subject, 'tree has NO subject');
    assert(treeParsed.topics[0].slug, 'tree nodes have slug');
    
    const inspectedPage = treeParsed.topics[0].children[0].children[0];
    assert(inspectedPage.type === 'page', 'tree page node has type=page');
    assert(inspectedPage.slug === 'whatisjava', 'tree page has slug');
    assert(inspectedPage.url, 'tree page has URL');
    assert(inspectedPage.url.startsWith('/tutorial-v2/'), 'tree page URL has correct pattern');
    
    const inspectedGroup = treeParsed.topics[0].children[0];
    assert(inspectedGroup.type === 'group', 'tree group node has type=group');
    assert(inspectedGroup.slug, 'tree group has slug');
    assert(!inspectedGroup.url, 'tree group has NO URL');
    
    console.log(`\n  📊 ROW DETAILS:`);
    console.log(`     brand_id: ${inspected.brand_id}`);
    console.log(`     topic_id: ${inspected.topic_id.slice(0, 8)}...`);
    console.log(`     status: ${inspected.status}`);
    console.log(`     version: ${inspected.version}`);
    console.log(`     source_format: ${inspected.source_format}`);
    console.log(`     tree.topics: ${treeParsed.topics.length} topic(s)`);
    console.log(`     tree has brand: ${!!treeParsed.brand}`);
    console.log(`     tree has theme: ${!!treeParsed.theme}`);
    console.log(`     tree has progress: ${!!treeParsed.progress}\n`);

    // ============================================================
    // FINAL REPORT
    // ============================================================
    console.log('====================================');
    if (testPassed) {
      console.log('✅ ALL TESTS PASSED\n');
      console.log('VERIFIED:');
      console.log('  ✅ Parent hierarchy validation');
      console.log('  ✅ Authoring JSON is clean (no brand/theme/progress)');
      console.log('  ✅ Normalization generates slug + URL');
      console.log('  ✅ Page nodes get URLs');
      console.log('  ✅ Group nodes get NO URLs');
      console.log('  ✅ Database UPSERT successful');
      console.log('  ✅ source_content remains clean');
      console.log('  ✅ tree contains normalized navigation only');
      console.log('  ✅ NO brand/theme/progress/subject in stored tree\n');
      
      if (existingRow) {
        console.log(`OPERATION: UPDATE (version ${existingRow.version} → ${saved.version})`);
      } else {
        console.log(`OPERATION: INSERT (version 1)`);
      }
      
      console.log('\n✅ READY FOR DEPLOYMENT\n');
    } else {
      console.log('❌ SOME TESTS FAILED\n');
      console.log('Review assertions above for details.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.constraint) console.error('Constraint:', error.constraint);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

main();
