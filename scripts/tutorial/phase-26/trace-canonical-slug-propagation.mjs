#!/usr/bin/env tsx

/**
 * ============================================================
 * PHASE 2.6: TRACE CANONICAL SLUG PROPAGATION
 * ============================================================
 * 
 * Trace exactly where the canonical slug is lost:
 * 
 * requestedSlug → hierarchy.subtopic.slug → activeUrl → redirect
 * 
 * Run with: npx tsx scripts/tutorial/phase-26/trace-canonical-slug-propagation.mjs
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

// Import delivery functions
import { getPublishedTutorialPagePayload } from '../../../src/share-branding/LearningExperience/tutorialSidebarDelivery';

function heading(title) {
  console.log('');
  console.log('='.repeat(78));
  console.log(title);
  console.log('='.repeat(78));
  console.log('');
}

async function traceUrl(label, params) {
  heading(`${label}: ${params.subtopicSlug} / ${params.navigationNodeId}`);
  
  console.log(`1. REQUESTED subtopicSlug: "${params.subtopicSlug}"`);
  console.log('');
  
  const result = await getPublishedTutorialPagePayload(params);
  
  if (!result) {
    console.log('❌ getPublishedTutorialPagePayload() returned NULL');
    console.log('');
    console.log('Cannot trace further - hierarchy resolution failed');
    return;
  }
  
  console.log('2. RESOLVED hierarchy.subtopic.slug:');
  console.log(`   "${result.hierarchy.subtopic.slug}"`);
  console.log('');
  
  // Check if tutorialId and canonicalSlug are present
  if ('tutorialId' in result.hierarchy.subtopic) {
    console.log('3. RESOLVED hierarchy.subtopic.tutorialId:');
    console.log(`   "${result.hierarchy.subtopic.tutorialId}"`);
    console.log('');
  } else {
    console.log('3. ⚠️  hierarchy.subtopic.tutorialId: NOT PRESENT');
    console.log('');
  }
  
  if ('canonicalSlug' in result.hierarchy.subtopic) {
    console.log('4. RESOLVED hierarchy.subtopic.canonicalSlug:');
    console.log(`   "${result.hierarchy.subtopic.canonicalSlug}"`);
    console.log('');
  } else {
    console.log('4. ⚠️  hierarchy.subtopic.canonicalSlug: NOT PRESENT');
    console.log('');
  }
  
  console.log('5. GENERATED activeUrl:');
  console.log(`   "${result.activeUrl}"`);
  console.log('');
  
  // Parse the activeUrl to extract the subtopic segment
  const urlParts = result.activeUrl.split('/');
  const subtopicSegmentIndex = urlParts.length - 2; // Second to last segment
  const subtopicInUrl = urlParts[subtopicSegmentIndex];
  
  console.log('6. EXTRACTED subtopic from activeUrl:');
  console.log(`   "${subtopicInUrl}"`);
  console.log('');
  
  // Compare
  console.log('7. COMPARISON:');
  console.log(`   Requested:  "${params.subtopicSlug}"`);
  console.log(`   Resolved:   "${result.hierarchy.subtopic.slug}"`);
  console.log(`   In URL:     "${subtopicInUrl}"`);
  console.log('');
  
  if (result.hierarchy.subtopic.slug === 'what-is-java-12efacf1') {
    console.log('✅ Canonical slug PRESERVED in hierarchy');
  } else if (result.hierarchy.subtopic.slug === 'whatisjava') {
    console.log('❌ Canonical slug LOST - regenerated compact slug');
  } else {
    console.log(`⚠️  Unexpected slug: "${result.hierarchy.subtopic.slug}"`);
  }
  console.log('');
  
  if (subtopicInUrl === 'what-is-java-12efacf1') {
    console.log('✅ Canonical slug PRESERVED in activeUrl');
  } else if (subtopicInUrl === 'whatisjava') {
    console.log('❌ Canonical slug LOST in activeUrl generation');
  } else {
    console.log(`⚠️  Unexpected URL segment: "${subtopicInUrl}"`);
  }
  console.log('');
  
  // Recommendation
  console.log('8. REDIRECT NEEDED:');
  if (params.subtopicSlug !== result.hierarchy.subtopic.slug) {
    console.log(`   YES - "${params.subtopicSlug}" should redirect to "${result.hierarchy.subtopic.slug}"`);
  } else {
    console.log('   NO - requested slug matches canonical');
  }
  console.log('');
}

async function main() {
  heading('PHASE 2.6: CANONICAL SLUG PROPAGATION TRACE');
  
  console.log('This script traces exactly how the canonical slug flows through:');
  console.log('');
  console.log('  requestedSlug');
  console.log('       ↓');
  console.log('  resolveHierarchy()');
  console.log('       ↓');
  console.log('  hierarchy.subtopic.slug');
  console.log('       ↓');
  console.log('  withTutorialV2Url()');
  console.log('       ↓');
  console.log('  activeUrl');
  console.log('       ↓');
  console.log('  page.tsx redirect check');
  console.log('');
  
  // Test URL A: canonical TutorialDB slug
  await traceUrl('URL A (CANONICAL)', {
    brandId: 'skillup',
    domainSlug: 'full-stack-development',
    subjectSlug: 'backend-development',
    topicSlug: 'java',
    subtopicSlug: 'what-is-java-12efacf1',
    navigationNodeId: 'whatisjava',
  });
  
  // Test URL B: legacy compact slug
  await traceUrl('URL B (LEGACY)', {
    brandId: 'skillup',
    domainSlug: 'full-stack-development',
    subjectSlug: 'backend-development',
    topicSlug: 'java',
    subtopicSlug: 'whatisjava',
    navigationNodeId: 'whatisjava',
  });
  
  heading('DIAGNOSTIC SUMMARY');
  
  console.log('Expected Phase 2.6 behavior:');
  console.log('');
  console.log('URL A (what-is-java-12efacf1/whatisjava):');
  console.log('  ✅ hierarchy.slug = "what-is-java-12efacf1"');
  console.log('  ✅ activeUrl contains "what-is-java-12efacf1"');
  console.log('  ✅ NO redirect needed');
  console.log('');
  console.log('URL B (whatisjava/whatisjava):');
  console.log('  ✅ hierarchy.slug = "what-is-java-12efacf1" (resolved via external_id)');
  console.log('  ✅ activeUrl contains "what-is-java-12efacf1"');
  console.log('  ✅ REDIRECT to .../what-is-java-12efacf1/whatisjava');
  console.log('');
  console.log('If the above does NOT match actual output, the canonical');
  console.log('identity fix is not yet complete end-to-end.');
  console.log('');
}

main();
