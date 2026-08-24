#!/usr/bin/env node
/**
 * Phase 1 Final Resolution Test
 * 
 * Tests the actual canonical normalization/resolution function
 * against real database values
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

/**
 * CANONICAL NORMALIZATION FUNCTION
 * 
 * Source: apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-left-sidebar/utils/navigation-id.ts
 * Function: normalizeNavigationId()
 * 
 * Canonical format: lowercase alphanumeric characters ONLY
 * - Remove all non-alphanumeric characters (spaces, hyphens, punctuation, etc.)
 * - No hyphens, no underscores, no spaces
 */
function normalizeNavigationId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * COMPACT SLUG (used in delivery)
 * 
 * Source: src/share-branding/LearningExperience/tutorialSidebarDelivery.ts
 * Function: compactSlug()
 * 
 * Same as normalizeNavigationId - removes all non-alphanumeric
 */
function compactSlug(value) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function testResolution() {
  try {
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('PHASE 1 — FINAL IDENTITY RESOLUTION TEST');
    console.log('══════════════════════════════════════════════════════════════════\n');

    // Get Java topic and its sidebar
    const topics = await pool.query(`
      SELECT
        tt.id,
        tt.external_id,
        tt.name,
        tt.slug,
        st.topic_id AS sidebar_topic_id,
        st.tree
      FROM tutorial_topics tt
      LEFT JOIN tutorial_sidebar_trees_v2 st
        ON st.topic_id = tt.external_id
      WHERE tt.name = 'Java'
      LIMIT 1
    `);

    if (topics.rows.length === 0) {
      console.log('❌ Java topic not found');
      process.exit(1);
    }

    const javaTopic = topics.rows[0];

    console.log('[1] TOPIC-LEVEL RELATIONSHIP TEST');
    console.log('─'.repeat(60));
    console.log('Tutorial Topic:');
    console.log(`  Internal ID: ${javaTopic.id}`);
    console.log(`  External ID: ${javaTopic.external_id}`);
    console.log(`  Name: ${javaTopic.name}`);
    console.log('');
    console.log('Sidebar:');
    console.log(`  Topic ID: ${javaTopic.sidebar_topic_id}`);
    console.log('');
    
    const topicMatch = javaTopic.external_id === javaTopic.sidebar_topic_id;
    console.log(`Result: ${topicMatch ? '✅' : '❌'} topic.external_id ${topicMatch ? '===' : '!=='} sidebar.topic_id`);
    console.log('');

    // Get "What is Java?" subtopics
    const subtopics = await pool.query(`
      SELECT
        id,
        external_id,
        name,
        slug,
        topic_id,
        created_at
      FROM tutorial_subtopics
      WHERE topic_id = $1
        AND name = 'What is Java?'
      ORDER BY created_at
    `, [javaTopic.id]);

    console.log('[2] SUBTOPIC SLUG RESOLUTION TEST');
    console.log('─'.repeat(60));
    console.log(`Found ${subtopics.rows.length} subtopic(s) named "What is Java?"\n`);

    // Find sidebar pages
    function findAllPages(tree) {
      const pages = [];
      
      function walk(node) {
        if (node.type === 'page') {
          pages.push({
            id: node.id,
            name: node.name,
            type: node.type
          });
        }
        if (Array.isArray(node.children)) {
          node.children.forEach(walk);
        }
      }

      if (Array.isArray(tree?.topics)) {
        tree.topics.forEach(walk);
      }

      return pages;
    }

    const allPages = findAllPages(javaTopic.tree);
    const whatIsJavaPages = allPages.filter(p => 
      p.name.toLowerCase().includes('java') && 
      p.id.includes('what')
    );

    console.log('Sidebar Pages (matching "what*java"):');
    whatIsJavaPages.forEach(page => {
      console.log(`  - id: ${page.id}, name: ${page.name}`);
    });
    console.log('');

    // Test each subtopic
    for (const subtopic of subtopics.rows) {
      console.log(`Subtopic Instance:`);
      console.log(`  ID: ${subtopic.id}`);
      console.log(`  Slug: ${subtopic.slug}`);
      console.log(`  Created: ${new Date(subtopic.created_at).toISOString().split('T')[0]}`);
      console.log('');

      // Test normalization
      const normalized = normalizeNavigationId(subtopic.slug);
      console.log(`  Normalization:`);
      console.log(`    Input: "${subtopic.slug}"`);
      console.log(`    Output: "${normalized}"`);
      console.log('');

      // Test against sidebar pages
      const matches = whatIsJavaPages.filter(page => {
        const pageNormalized = normalizeNavigationId(page.id);
        return pageNormalized === normalized || page.id === normalized;
      });

      if (matches.length > 0) {
        console.log(`  ✅ MATCH FOUND:`);
        matches.forEach(match => {
          console.log(`    Sidebar page.id: "${match.id}"`);
          console.log(`    Sidebar page.name: "${match.name}"`);
        });
      } else {
        console.log(`  ❌ NO EXACT MATCH`);
        console.log(`  Searching with relaxed matching...`);
        
        // Try finding any page with similar normalized form
        const relaxedMatches = allPages.filter(page => {
          const pageNormalized = normalizeNavigationId(page.id);
          return pageNormalized.includes('what') && pageNormalized.includes('java');
        }).slice(0, 3);

        if (relaxedMatches.length > 0) {
          console.log(`  Possible matches by content:`);
          relaxedMatches.forEach(match => {
            console.log(`    - "${match.id}" (normalized: "${normalizeNavigationId(match.id)}")`);
          });
        }
      }

      console.log('');
    }

    // Test collision detection
    console.log('[3] COLLISION ANALYSIS');
    console.log('─'.repeat(60));

    const testSlugs = [
      'what-is-java',
      'whatisjava',
      'what_is_java',
      'WHAT-IS-JAVA',
      'What Is Java?',
      'what-is-java?'
    ];

    console.log('Testing slug collision detection:\n');
    const normalizedMap = new Map();

    testSlugs.forEach(slug => {
      const norm = normalizeNavigationId(slug);
      if (!normalizedMap.has(norm)) {
        normalizedMap.set(norm, []);
      }
      normalizedMap.get(norm).push(slug);
    });

    let collisionFound = false;
    normalizedMap.forEach((slugs, normalized) => {
      if (slugs.length > 1) {
        console.log(`🚨 COLLISION DETECTED for normalized: "${normalized}"`);
        slugs.forEach(s => console.log(`   - "${s}"`));
        console.log('');
        collisionFound = true;
      }
    });

    if (!collisionFound) {
      console.log('✅ No collisions detected in test set\n');
    }

    // Test the actual sidebar page
    console.log('[4] ACTUAL SIDEBAR PAGE TEST');
    console.log('─'.repeat(60));
    
    const actualPage = allPages.find(p => p.id === 'what-is-java');
    if (actualPage) {
      console.log('Actual sidebar page found:');
      console.log(`  id: "${actualPage.id}"`);
      console.log(`  name: "${actualPage.name}"`);
      console.log(`  normalized: "${normalizeNavigationId(actualPage.id)}"`);
      console.log('');

      console.log('Which subtopic slug resolves to this page?');
      subtopics.rows.forEach(sub => {
        const matches = normalizeNavigationId(sub.slug) === normalizeNavigationId(actualPage.id);
        console.log(`  ${matches ? '✅' : '❌'} "${sub.slug}" → "${normalizeNavigationId(sub.slug)}"`);
      });
    }

    console.log('');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('RESOLUTION TEST COMPLETE');
    console.log('══════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testResolution();
