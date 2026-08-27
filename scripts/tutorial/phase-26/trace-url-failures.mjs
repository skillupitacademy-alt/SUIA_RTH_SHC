#!/usr/bin/env tsx

/**
 * ============================================================
 * PHASE 2.6: TRACE URL A AND URL B FAILURES
 * ============================================================
 * 
 * Objective: Determine EXACTLY where each URL fails
 * 
 * URL A: .../what-is-java-12efacf1/whatisjava → 404
 * URL B: .../whatisjava/whatisjava → Shell + "Content not published"
 * 
 * Run with: npx tsx scripts/tutorial/phase-26/trace-url-failures.mjs
 * 
 * ============================================================
 */

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

config({ path: path.join(PROJECT_ROOT, '.env.local') });

// Import actual delivery function
import { getPublishedTutorialPagePayload } from '../../../src/share-branding/LearningExperience/tutorialSidebarDelivery';

const URL_A_PARAMS = {
  brandId: 'skillup',
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  subtopicSlug: 'what-is-java-12efacf1', // Tutorial subtopics.slug
  navigationNodeId: 'whatisjava',
};

const URL_B_PARAMS = {
  brandId: 'skillup',
  domainSlug: 'full-stack-development',
  subjectSlug: 'backend-development',
  topicSlug: 'java',
  subtopicSlug: 'whatisjava', // Compact slug
  navigationNodeId: 'whatisjava',
};

function printHeader(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

async function testUrl(label, params) {
  printHeader(`${label}: ${params.subtopicSlug}/${params.navigationNodeId}`);
  
  console.log('');
  console.log('Parameters:');
  console.log(JSON.stringify(params, null, 2));
  console.log('');
  console.log('Calling getPublishedTutorialPagePayload...');
  console.log('');

  try {
    const result = await getPublishedTutorialPagePayload(params);

    if (!result) {
      console.log('');
      console.log('❌ RESULT: NULL');
      console.log('');
      console.log('This causes 404 in Next.js route');
      console.log('');
      console.log('Check [DELIVERY_TRACE] logs above to see where it failed:');
      console.log('  - resolveHierarchy FAIL?');
      console.log('  - navigation node validation failed?');
      console.log('  - activeUrl empty?');
      console.log('  - sidebar not found?');
      return { success: false, reason: 'null_result' };
    }

    console.log('');
    console.log('✅ RESULT: PAYLOAD RETURNED');
    console.log('');
    console.log('Hierarchy:');
    console.log(`  Domain:    ${result.hierarchy.domain.name}`);
    console.log(`  Subject:   ${result.hierarchy.subject.name}`);
    console.log(`  Topic:     ${result.hierarchy.topic.name}`);
    console.log(`  Subtopic:  ${result.hierarchy.subtopic.name} (${result.hierarchy.subtopic.id})`);
    console.log('');
    console.log(`Active URL: ${result.activeUrl}`);
    console.log('');
    console.log('Content:');
    console.log(`  Section ID: ${result.content.sectionId ?? 'NULL'}`);
    console.log(`  Block count: ${result.content.blocks?.length ?? 0}`);
    
    if (result.content.blocks && result.content.blocks.length > 0) {
      console.log('');
      console.log('  First block:');
      const firstBlock = result.content.blocks[0];
      console.log(`    Type:    ${firstBlock.type}`);
      console.log(`    Version: ${firstBlock.version}`);
      console.log(`    ID:      ${firstBlock.id}`);
    } else {
      console.log('');
      console.log('  ⚠️  Blocks array is EMPTY');
      console.log('  This causes "Content not published" message');
    }

    return { 
      success: true, 
      hasContent: result.content.blocks?.length > 0,
      sectionId: result.content.sectionId,
    };

  } catch (error) {
    console.error('');
    console.error('❌ EXCEPTION:');
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    return { success: false, reason: 'exception', error };
  }
}

async function main() {
  printHeader('PHASE 2.6: URL FAILURE TRACE');
  
  console.log('');
  console.log('Testing two URLs that fail differently:');
  console.log('');
  console.log('URL A: .../what-is-java-12efacf1/whatisjava');
  console.log('       Expected: 404');
  console.log('');
  console.log('URL B: .../whatisjava/whatisjava');
  console.log('       Expected: Shell loads + "Content not published"');
  console.log('');

  const resultA = await testUrl('URL A', URL_A_PARAMS);
  const resultB = await testUrl('URL B', URL_B_PARAMS);

  printHeader('SUMMARY');
  
  console.log('');
  console.log('URL A (.../what-is-java-12efacf1/whatisjava):');
  if (!resultA.success) {
    console.log('  ❌ Returns NULL → causes 404');
    console.log(`  Reason: ${resultA.reason}`);
  } else {
    console.log('  ✅ Payload returned');
    console.log(`  Has content: ${resultA.hasContent}`);
    console.log(`  Section ID: ${resultA.sectionId ?? 'NULL'}`);
  }

  console.log('');
  console.log('URL B (.../whatisjava/whatisjava):');
  if (!resultB.success) {
    console.log('  ❌ Returns NULL → causes 404');
    console.log(`  Reason: ${resultB.reason}`);
  } else {
    console.log('  ✅ Payload returned');
    console.log(`  Has content: ${resultB.hasContent}`);
    console.log(`  Section ID: ${resultB.sectionId ?? 'NULL'}`);
  }

  console.log('');
  printHeader('DIAGNOSIS');
  console.log('');

  if (!resultA.success && !resultB.success) {
    console.log('❌ BOTH URLs FAIL');
    console.log('   resolveHierarchy() likely failing for both');
  } else if (!resultA.success && resultB.success) {
    console.log('❌ URL A FAILS, URL B SUCCEEDS');
    console.log('   URL A fails during hierarchy/subtopic resolution');
    console.log('   URL B passes hierarchy but has no content');
    console.log('');
    console.log('ROOT CAUSE FOR URL A:');
    console.log('  Subtopic slug "what-is-java-12efacf1" not resolving');
    console.log('  Check resolveHierarchy() fallback logic');
  } else if (resultA.success && !resultB.success) {
    console.log('⚠️  URL A SUCCEEDS, URL B FAILS');
    console.log('   Unexpected! URL B should be simpler.');
  } else {
    console.log('✅ BOTH URLs SUCCEED at payload level');
    console.log('');
    if (!resultA.hasContent && !resultB.hasContent) {
      console.log('⚠️  Neither has content (blocks empty)');
      console.log('   Section lookup may be failing for both');
      console.log('   Check getTutorialByPage() logic');
    } else if (!resultA.hasContent) {
      console.log('⚠️  URL A has no content');
    } else if (!resultB.hasContent) {
      console.log('⚠️  URL B has no content');
    } else {
      console.log('✅ Both have content!');
    }
  }

  console.log('');
}

main();
