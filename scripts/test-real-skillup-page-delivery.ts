#!/usr/bin/env tsx

/**
 * REAL SkillUp Page Delivery Test (TypeScript)
 * 
 * This test executes the ACTUAL production code path by importing real functions.
 * Run with: npx tsx scripts/test-real-skillup-page-delivery.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing modules that need them
config({ path: resolve(process.cwd(), '.env.local') });

import { getPublishedTutorialPagePayload } from '../src/share-branding/LearningExperience/tutorialSidebarDelivery';
import type { TutorialNavigationNode } from '../packages/types/src/tutorial-sidebar.types';

const TEST_PARAMS = {
  brandId: 'skillup' as const,
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  subtopicSlug: 'whatisjava',
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    testsFailed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
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

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('REAL SKILLUP PAGE DELIVERY TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Testing URL: https://user.skillupitacademy.com/tutorial-v2/full-stack-development/backend-development/java/whatisjava');
  console.log('');

  try {
    // ═══════════════════════════════════════════════════════════════
    // Execute REAL getPublishedTutorialPagePayload
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 1: Execute REAL getPublishedTutorialPagePayload()');
    console.log('───────────────────────────────────────────────────────────────');

    const payload = await getPublishedTutorialPagePayload(TEST_PARAMS);

    assert(payload !== null, 'Payload is not null');

    if (!payload) {
      console.log('');
      console.log('❌ PAYLOAD IS NULL');
      console.log('This would trigger notFound() in page.tsx');
      console.log('Expected: Valid payload with sidebar and empty content');
      console.log('');
      process.exit(1);
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify Payload Structure
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 2: Verify Payload Structure');
    console.log('───────────────────────────────────────────────────────────────');

    assertEqual(payload.brandId, 'skillup', 'brandId is skillup');
    assert(payload.theme !== undefined, 'theme exists');
    assert(payload.sidebar !== undefined, 'sidebar exists');
    assert(payload.activeUrl !== undefined, 'activeUrl exists');
    assert(payload.hierarchy !== undefined, 'hierarchy exists');
    assert(payload.content !== undefined, 'content exists');
    assert(payload.footer !== undefined, 'footer exists');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify Runtime Branding
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 3: Verify Runtime Branding (sidebar)');
    console.log('───────────────────────────────────────────────────────────────');

    assert(payload.sidebar.brand !== undefined, 'sidebar.brand exists');
    assert(payload.sidebar.theme !== undefined, 'sidebar.theme exists');
    assert(payload.sidebar.subject !== undefined, 'sidebar.subject exists');
    assert(payload.sidebar.progress !== undefined, 'sidebar.progress exists');
    assert(payload.sidebar.topics !== undefined, 'sidebar.topics exists');

    if (payload.sidebar.brand) {
      assertEqual(payload.sidebar.brand.name, 'SkillUp IT Academy', 'brand.name is correct');
      assertEqual(payload.sidebar.brand.shortName, 'SUIA', 'brand.shortName is correct');
      assertEqual(payload.sidebar.brand.tagline, 'Build Skills That Move Careers', 'brand.tagline is correct');
      console.log(`  ℹ️  brand.logoUrl: ${payload.sidebar.brand.logoUrl ?? 'undefined (will fallback to shortName)'}`);
    }

    if (payload.sidebar.theme) {
      assertEqual(payload.sidebar.theme.primary, '#f54a8d', 'theme.primary is correct');
      assertEqual(payload.sidebar.theme.secondary, '#133382', 'theme.secondary is correct');
    }

    if (payload.sidebar.subject) {
      assertEqual(payload.sidebar.subject.name, 'Backend Development', 'subject.name is correct');
    }

    if (payload.sidebar.progress) {
      assertEqual(payload.sidebar.progress.percentage, 0, 'progress.percentage is 0');
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify Topics Structure
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 4: Verify Topics Structure');
    console.log('───────────────────────────────────────────────────────────────');

    assert(payload.sidebar.topics.length > 0, `sidebar has ${payload.sidebar.topics.length} topics`);

    payload.sidebar.topics.forEach((topic: TutorialNavigationNode, i: number) => {
      console.log(`  ${i + 1}. ${topic.name} (${topic.type})`);
      assert(topic.slug !== undefined, `  - topic.slug exists: ${topic.slug}`);
      if (topic.type === 'page') {
        assert(topic.url !== undefined, `  - topic.url exists: ${topic.url}`);
      }
      if (topic.children) {
        topic.children.forEach((child: TutorialNavigationNode, j: number) => {
          console.log(`     ${i + 1}.${j + 1}. ${child.name} (${child.type})`);
          assert(child.slug !== undefined, `       - child.slug exists: ${child.slug}`);
          if (child.type === 'page') {
            assert(child.url !== undefined, `       - child.url exists: ${child.url}`);
          }
        });
      }
    });

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify Active URL
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 5: Verify Active URL');
    console.log('───────────────────────────────────────────────────────────────');

    assertEqual(
      payload.activeUrl,
      '/tutorial-v2/full-stack-development/backend-development/java/whatisjava',
      'activeUrl is correct'
    );

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify Hierarchy
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 6: Verify Hierarchy');
    console.log('───────────────────────────────────────────────────────────────');

    assertEqual(payload.hierarchy.domain.name, 'Full Stack Development', 'domain.name is correct');
    assertEqual(payload.hierarchy.subject.name, 'Backend Development', 'subject.name is correct');
    assertEqual(payload.hierarchy.topic.name, 'Java', 'topic.name is correct');
    assertEqual(payload.hierarchy.subtopic.name, 'What is Java?', 'subtopic.name is correct');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify Content (expected to be empty)
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 7: Verify Content (expected to be empty)');
    console.log('───────────────────────────────────────────────────────────────');

    const hasDefinition = payload.content.definition !== undefined;
    const hasCode = payload.content.code !== undefined;
    const hasSummary = payload.content.summary !== undefined;

    if (!hasDefinition && !hasCode && !hasSummary) {
      console.log('  ℹ️  No published content found (expected)');
      console.log('  ℹ️  Page will render with "Content is not published" message');
      console.log('  ✅ Empty content does not prevent payload generation');
    } else {
      console.log(`  ℹ️  Found content: ${[
        hasDefinition && 'definition',
        hasCode && 'code',
        hasSummary && 'summary'
      ].filter(Boolean).join(', ')}`);
    }

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify TutorialPageShell Requirements
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 8: Verify TutorialPageShell Requirements');
    console.log('───────────────────────────────────────────────────────────────');

    // TutorialPageShell expects these properties
    assert(payload.hierarchy.domain.name !== undefined, 'hierarchy.domain.name for header crumbs');
    assert(payload.hierarchy.subject.name !== undefined, 'hierarchy.subject.name for header crumbs');
    assert(payload.hierarchy.topic.name !== undefined, 'hierarchy.topic.name for header crumbs');
    assert(payload.hierarchy.subtopic.name !== undefined, 'hierarchy.subtopic.name for header active');
    assert(payload.sidebar.brand !== undefined, 'sidebar.brand for header');
    assert(payload.theme !== undefined, 'theme for header');

    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // Verify TutorialLeftSidebar Requirements
    // ═══════════════════════════════════════════════════════════════
    console.log('STEP 9: Verify TutorialLeftSidebar Requirements');
    console.log('───────────────────────────────────────────────────────────────');

    // TutorialLeftSidebar expects these properties
    assert(payload.sidebar.brand.name !== undefined, 'tree.brand.name');
    assert(payload.sidebar.brand.shortName !== undefined, 'tree.brand.shortName');
    assert(payload.sidebar.brand.tagline !== undefined, 'tree.brand.tagline');
    // logoUrl is optional - component handles undefined
    assert(payload.sidebar.theme.primary !== undefined, 'tree.theme.primary');
    assert(payload.sidebar.theme.secondary !== undefined, 'tree.theme.secondary');
    assert(payload.sidebar.theme.completed !== undefined, 'tree.theme.completed');
    assert(payload.sidebar.theme.activeBackground !== undefined, 'tree.theme.activeBackground');
    assert(payload.sidebar.subject.name !== undefined, 'tree.subject.name');
    assert(payload.sidebar.progress.percentage !== undefined, 'tree.progress.percentage');
    assert(Array.isArray(payload.sidebar.topics), 'tree.topics is array');

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
      console.log('✅ ALL TESTS PASSED!');
      console.log('');
      console.log('REAL PRODUCTION CODE PATH VERIFIED:');
      console.log('  ✓ getPublishedTutorialPagePayload() returns valid payload');
      console.log('  ✓ Hierarchy resolution works');
      console.log('  ✓ Sidebar retrieval works');
      console.log('  ✓ Runtime branding applied correctly');
      console.log('  ✓ All required properties exist');
      console.log('  ✓ Empty content does not break payload');
      console.log('  ✓ TutorialPageShell requirements met');
      console.log('  ✓ TutorialLeftSidebar requirements met');
      console.log('');
      console.log('EXPECTED RENDERING:');
      console.log('  ✓ Page loads successfully (HTTP 200)');
      console.log('  ✓ TutorialHeader renders');
      console.log('  ✓ TutorialLeftSidebar renders (isSidebarOpen=true)');
      console.log('  ✓ Main content shows fallback: "Content is not published..."');
      console.log('  ✓ TutorialFooterNavigation renders');
      console.log('');
      console.log('If production still returns 503, the issue is:');
      console.log('  1. Deployed code does NOT match this local codebase');
      console.log('  2. Environment variables missing (DATABASE_URL_TUTORIAL)');
      console.log('  3. Database connectivity issue from Cloud Run');
      console.log('  4. React component render error (need production logs)');
      console.log('');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('The REAL delivery function has issues that need fixing.');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ EXCEPTION THROWN BY REAL DELIVERY FUNCTION:');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('This is the likely cause of the production 503 error.\n');
    console.error('Error:', error);
    console.error('\nStack Trace:');
    if (error instanceof Error) {
      console.error(error.stack);
    }
    console.error('');
    console.error('This exception would cause Next.js SSR to fail with HTTP 503.');
    console.error('');
    process.exit(1);
  }
}

main();
